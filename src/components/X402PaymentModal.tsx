"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Box, FileText, Wallet, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import {
  createWalletClient,
  createPublicClient,
  custom,
  http,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import { publicActions } from 'viem';

export interface X402PaymentDetails {
  amount: number;
  recipient: string;
  network: string;
  description: string;
  actionType: 'unlock' | 'simulate';
  /** Base64-encoded PaymentRequired JSON from the 402 response PAYMENT-REQUIRED header */
  paymentRequiredHeader?: string;
}

interface X402PaymentModalProps {
  details: X402PaymentDetails | null;
  /** Called with the payment headers to retry the request */
  onSuccess: (paymentHeaders: Record<string, string>) => void;
  onCancel: () => void;
}

export function X402PaymentModal({ details, onSuccess, onCancel }: X402PaymentModalProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    setStatus('idle');
    setErrorMessage(null);
    setWalletAddress(null);
  }, [details]);

  if (!details) return null;

  const handlePay = async () => {
    setErrorMessage(null);

    // Check for browser wallet
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      setErrorMessage('No wallet detected. Please install MetaMask or Coinbase Wallet.');
      setStatus('error');
      return;
    }

    if (!details.paymentRequiredHeader) {
      setErrorMessage('Missing payment requirements. Please try again.');
      setStatus('error');
      return;
    }

    try {
      setStatus('connecting');

      const ethereum = (window as any).ethereum;

      // Request wallet connection
      const accounts: string[] = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      const account = accounts[0] as `0x${string}`;
      setWalletAddress(account);

      // Ensure wallet is on Base Sepolia (chain ID 84532 = 0x14A34)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x14A34' }],
        });
      } catch (switchError: any) {
        // If chain doesn't exist, add it
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x14A34',
              chainName: 'Base Sepolia',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.base.org'],
              blockExplorerUrls: ['https://sepolia.basescan.org'],
            }],
          });
        } else {
          throw switchError;
        }
      }

      setStatus('signing');

      // Create viem wallet client from browser wallet
      const walletClient = createWalletClient({
        account,
        chain: baseSepolia,
        transport: custom(ethereum),
      }).extend(publicActions);

      // Also create a public client for contract reads
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http('https://sepolia.base.org'),
      });

      // Dynamically import x402 client-side SDK
      // These are client-only modules
      const { x402Client, x402HTTPClient } = await import('@x402/core/client');
      const { registerExactEvmScheme } = await import('@x402/evm/exact/client');
      const { toClientEvmSigner } = await import('@x402/evm');

      // Create signer from browser wallet
      const signer = toClientEvmSigner(
        {
          address: account,
          signTypedData: (msg: any) => walletClient.signTypedData(msg),
        },
        publicClient as any,
      );

      // Create and configure x402 client
      const client = new x402Client();
      registerExactEvmScheme(client, { signer });
      const httpClient = new x402HTTPClient(client);

      // Parse the PAYMENT-REQUIRED header
      const paymentRequired = httpClient.getPaymentRequiredResponse(
        (name: string) => {
          if (name.toLowerCase() === 'payment-required') {
            return details.paymentRequiredHeader!;
          }
          return null;
        },
      );

      // Create payment payload (this triggers wallet signature popup)
      const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);

      // Encode as headers for retry request
      const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

      setStatus('success');
      toast.success('Payment signed', {
        description: `Signed by ${account.slice(0, 6)}...${account.slice(-4)}`,
      });

      // Return headers to parent after brief delay for UX
      setTimeout(() => {
        onSuccess(paymentHeaders);
      }, 1200);
    } catch (error: any) {
      console.error('x402 payment error:', error);
      const msg = error?.message || 'Payment failed. Please try again.';

      // User rejection
      if (error?.code === 4001 || msg.includes('User rejected') || msg.includes('user rejected')) {
        setErrorMessage('Transaction rejected by user.');
      } else {
        setErrorMessage(msg.length > 120 ? msg.slice(0, 120) + '...' : msg);
      }
      setStatus('error');
    }
  };

  const statusLabel = {
    idle: null,
    connecting: 'Connecting Wallet...',
    signing: 'Awaiting Signature...',
    success: 'Payment Signed',
    error: null,
  }[status];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div
        className={`w-full max-w-sm bg-[#0a0a0a] border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.2)] rounded-lg overflow-hidden flex flex-col font-mono relative transition-all duration-300 ${
          status === 'success' ? 'border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.4)] scale-105' : 'scale-100'
        }`}
      >
        {/* Payment success shimmer overlay */}
        {status === 'success' && (
          <div className="payment-shimmer-overlay" />
        )}

        {/* Receipt Header pattern */}
        <div className="h-4 w-full bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 10px 0, transparent 10px, #0a0a0a 11px)', backgroundSize: '20px 20px', backgroundPosition: '-10px -10px' }}></div>
        </div>

        <div className="p-6 pt-4 flex flex-col items-center">
          {/* Header */}
          <div className="flex flex-col items-center mb-6 w-full text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              {details.actionType === 'simulate' ? <Box size={24} /> : <FileText size={24} />}
            </div>
            <h2 className="text-white text-lg font-bold tracking-widest uppercase mb-1">
              x402 Digital Bill
            </h2>
            <p className="text-white/50 text-xs tracking-wider">
              {details.actionType === 'simulate' ? 'MISTRAL SANDBOX SIMULATION' : 'KNOWLEDGE UNLOCK'}
            </p>
          </div>

          {/* Dotted separator */}
          <div className="w-full border-t-2 border-dashed border-white/20 mb-6"></div>

          {/* Details */}
          <div className="w-full space-y-4 text-sm mb-6">
            <div className="flex justify-between items-start">
              <span className="text-white/50 uppercase">Description</span>
              <span className="text-white text-right max-w-[200px] leading-snug">{details.description}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/50 uppercase">Recipient</span>
              <span className="text-white bg-white/5 px-2 py-0.5 rounded">{details.recipient}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/50 uppercase">Network</span>
              <span className="text-emerald-400">{details.network}</span>
            </div>

            {walletAddress && (
              <div className="flex justify-between items-center">
                <span className="text-white/50 uppercase">Wallet</span>
                <span className="text-emerald-400 text-xs">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
            )}
          </div>

          {/* Dotted separator */}
          <div className="w-full border-t-2 border-dashed border-white/20 mb-6"></div>

          {/* Total */}
          <div className="w-full flex justify-between items-end mb-8">
            <span className="text-white/70 uppercase font-bold tracking-widest">Total Amount</span>
            <div className="text-right">
              <div className="text-3xl text-emerald-400 font-black">${details.amount.toFixed(3)}</div>
              <div className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">USDC ON BASE SEPOLIA</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            {status === 'idle' && (
              <>
                <button
                  onClick={handlePay}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-sm py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Connect Wallet & Pay
                </button>
                <button
                  onClick={onCancel}
                  className="w-full bg-transparent hover:bg-white/5 border border-white/20 text-white/70 font-bold uppercase tracking-widest text-xs py-3 rounded transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {(status === 'connecting' || status === 'signing') && (
              <button
                disabled
                className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-widest text-sm py-3 rounded flex items-center justify-center gap-2 cursor-wait"
              >
                <Loader2 size={16} className="animate-spin" />
                {statusLabel}
              </button>
            )}

            {status === 'success' && (
              <button
                disabled
                className="w-full bg-emerald-500 text-black font-bold uppercase tracking-widest text-sm py-3 rounded flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Payment Signed
              </button>
            )}

            {status === 'error' && (
              <>
                {errorMessage && (
                  <div className="flex items-start gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 p-3 rounded">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                <button
                  onClick={handlePay}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold uppercase tracking-widest text-sm py-3 rounded transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet size={16} />
                  Retry
                </button>
                <button
                  onClick={onCancel}
                  className="w-full bg-transparent hover:bg-white/5 border border-white/20 text-white/70 font-bold uppercase tracking-widest text-xs py-3 rounded transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Receipt Footer pattern */}
        <div className="h-4 w-full bg-[#0a0a0a] relative overflow-hidden mt-auto">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 10px 20px, transparent 10px, #0a0a0a 11px)', backgroundSize: '20px 20px', backgroundPosition: '-10px 0px' }}></div>
        </div>
      </div>
    </div>
  );
}
