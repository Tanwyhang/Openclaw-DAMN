import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "./ui/button";
import { X402PaymentModal, type X402PaymentDetails } from "./X402PaymentModal";
import { toast } from "@/components/ui/sonner";

interface AddKnowledgeModalProps {
  onClose: () => void;
  onSave?: (data: any) => void;
}

export function AddKnowledgeModal({ onClose, onSave }: AddKnowledgeModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Architecture");
  const [problemDescription, setProblemDescription] = useState("");
  const [solutionDescription, setSolutionDescription] = useState("");

  const [isGated, setIsGated] = useState(false);
  const [price, setPrice] = useState("0.50");
  const [hireValidator, setHireValidator] = useState(false);

  // x402 Payment state
  const [paymentDetails, setPaymentDetails] = useState<X402PaymentDetails | null>(null);

  const handleSaveInit = async () => {
    if (hireValidator) {
      // Call the simulate API first to get a 402 with payment requirements
      try {
        const response = await fetch("/api/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            knowledgeId: "new",
            title,
            problem: problemDescription,
            solution: solutionDescription,
            category,
          }),
        });

        if (response.status === 402) {
          const paymentRequiredHeader = response.headers.get("payment-required");
          if (!paymentRequiredHeader) {
            toast.error("Payment required but no payment details received");
            return;
          }
          setPaymentDetails({
            amount: 0.001,
            recipient: "0x643C...1598",
            network: "Base Sepolia",
            description: "Simulation for new knowledge index",
            actionType: 'simulate',
            paymentRequiredHeader,
          });
        } else {
          // Not gated or already paid
          executeSave();
        }
      } catch (error) {
        toast.error("Failed to initiate simulation");
      }
    } else {
      executeSave();
    }
  };

  const executeSave = () => {
    if (onSave) {
      onSave({
        title,
        category,
        problem: problemDescription,
        solution: solutionDescription,
        isGated,
        price: isGated ? parseFloat(price) : undefined,
        isSimulated: hireValidator
      });
    }
    toast.success("Knowledge indexed", { description: hireValidator ? "Simulation complete, knowledge added" : "New knowledge added to index" });
    onClose();
  };

  const handlePaymentSuccess = (_paymentHeaders: Record<string, string>) => {
    setPaymentDetails(null);
    toast.success("Simulation complete", { description: "$0.001 paid via x402" });
    executeSave();
  };

  const handlePaymentCancel = () => {
    setPaymentDetails(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border-4 border-primary shadow-[0_0_30px_rgba(255,59,0,0.4)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-primary border-b-4 border-primary">
          <div className="flex items-center gap-3 text-black">
            <h2 className="text-xl font-black tracking-widest uppercase [font-family:var(--font-press-start)]">
              ADD KNOWLEDGE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-black transition-colors border-2 border-black hover:bg-black hover:text-primary"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-xs font-bold tracking-wider text-primary uppercase">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border-2 border-primary/50 text-white p-2 outline-none focus:border-primary transition-colors"
                placeholder="e.g. Memory Leak in Cache Layer"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-bold tracking-wider text-primary uppercase">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black border-2 border-primary/50 text-white p-2 outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="Architecture">Architecture</option>
                <option value="Data">Data</option>
                <option value="Performance">Performance</option>
                <option value="Security">Security</option>
                <option value="DevOps">DevOps</option>
                <option value="API">API</option>
              </select>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monetization (x402) */}
              <div className="bg-black/50 p-4 border border-white/10 rounded">
                <h3 className="mb-3 text-sm font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Monetization
                </h3>
                <label className="flex items-center gap-3 cursor-pointer mb-3">
                  <input 
                    type="checkbox"
                    checked={isGated}
                    onChange={(e) => setIsGated(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-white text-sm">Gate Solution (x402 protocol)</span>
                </label>
                {isGated && (
                  <div className="ml-7">
                    <label className="block mb-1 text-xs text-white/50 uppercase tracking-wider">Price (USD)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50">$</span>
                      <input 
                        type="number"
                        min="0.10"
                        step="0.10"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="bg-black border border-white/20 text-white p-1.5 outline-none focus:border-emerald-400 w-24 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Sandbox Simulation */}
              <div className="bg-black/50 p-4 border border-white/10 rounded">
                <h3 className="mb-3 text-sm font-bold tracking-wider text-blue-400 uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  Sandbox Simulation
                </h3>
                <label className="flex items-start gap-3 cursor-pointer mb-2">
                  <input 
                    type="checkbox"
                    checked={hireValidator}
                    onChange={(e) => setHireValidator(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 mt-0.5"
                  />
                  <div>
                    <span className="text-white text-sm block">Run Simulation Before Indexing</span>
                    <span className="text-xs text-white/50 block mt-0.5">Mistral AI Secure Sandbox</span>
                  </div>
                </label>
                {hireValidator && (
                  <div className="ml-7 mt-2 text-xs font-mono text-white/70 bg-blue-500/10 border border-blue-500/20 p-2 rounded">
                    <div>Env: Mistral Sandbox</div>
                    <div>Cost: <span className="text-blue-400 font-bold">$0.001 USDC</span> (x402)</div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="mb-4 text-sm font-bold tracking-wider text-red-400 uppercase">Problem</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-xs font-bold tracking-wider text-white/70 uppercase">Description (Markdown supported)</label>
                  <textarea 
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    className="w-full bg-black border border-white/20 text-white p-2 outline-none focus:border-red-400 transition-colors min-h-[150px]"
                    placeholder="Describe the issue and how it was discovered..."
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h3 className="mb-4 text-sm font-bold tracking-wider text-emerald-400 uppercase">Solution</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-xs font-bold tracking-wider text-white/70 uppercase">Description (Markdown supported)</label>
                  <textarea 
                    value={solutionDescription}
                    onChange={(e) => setSolutionDescription(e.target.value)}
                    className="w-full bg-black border border-white/20 text-white p-2 outline-none focus:border-emerald-400 transition-colors min-h-[150px]"
                    placeholder="Describe the fix and the steps taken to resolve it..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between p-4 bg-gray-900 border-t-2 border-white/10">
          <div className="text-xs font-mono font-bold text-white/70 flex items-center gap-4">
            {hireValidator && (
              <span className="bg-black/50 p-2 rounded">ESTIMATED PAYMENT: <span className="text-blue-400">$0.001 USDC</span></span>
            )}
          </div>
          <Button 
            onClick={handleSaveInit}
            className="flex items-center gap-2 px-6 py-2 text-black transition-all bg-primary hover:bg-white border-2 border-primary font-bold uppercase tracking-wider"
          >
            <Save size={16} />
            {hireValidator ? "Pay $0.001 & Simulate" : "Index Knowledge"}
          </Button>
        </div>
      </div>

      {/* x402 Payment Modal Layer */}
      <X402PaymentModal 
        details={paymentDetails} 
        onSuccess={handlePaymentSuccess} 
        onCancel={handlePaymentCancel} 
      />
    </div>
  );
}
