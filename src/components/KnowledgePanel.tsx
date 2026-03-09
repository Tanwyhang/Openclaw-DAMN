"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { Badge } from "@/components/ui/badge";
import { CATEGORY_COLORS, type Knowledge } from "@/data/knowledge";
import { Lock, Unlock, Loader2, FlaskConical, ArrowUp, ArrowDown, X } from "lucide-react";
import { KNOWLEDGE_DATA } from "@/data/knowledge";
import { X402PaymentModal, type X402PaymentDetails } from "./X402PaymentModal";
import { SimulationFlow } from "./SimulationFlow";
import { toast } from "@/components/ui/sonner";

interface KnowledgeModalProps {
  knowledge: Knowledge | null;
  onClose: () => void;
}

export function KnowledgeModal({ knowledge, onClose }: KnowledgeModalProps) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"problem" | "solution" | "simulation">("problem");
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  const [simulationStatus, setSimulationStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [hasNewSimulation, setHasNewSimulation] = useState(false);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);
  const [votes, setVotes] = useState({ up: 0, down: 0 });

  // Simulation results state
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulationVerdict, setSimulationVerdict] = useState<"SUCCESS" | "FAILURE" | "ERROR" | null>(null);
  const [simulationTestsPassed, setSimulationTestsPassed] = useState(0);
  const [simulationTestsFailed, setSimulationTestsFailed] = useState(0);
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [simulationType, setSimulationType] = useState<"code" | "theoretical" | null>(null);
  const [paymentTxHash, setPaymentTxHash] = useState<string | null>(null);
  const [paymentPending, setPaymentPending] = useState(false);
  const [showPaymentShimmer, setShowPaymentShimmer] = useState(false);

  // x402 Payment state
  const [paymentDetails, setPaymentDetails] = useState<X402PaymentDetails | null>(null);
  // Store the pending simulation request body so we can retry after payment
  const [pendingSimulationBody, setPendingSimulationBody] = useState<any>(null);

  useEffect(() => {
    if (knowledge) {
      const t = setTimeout(() => setVisible(true), 20);
      setActiveTab("problem");
      setPaymentStatus("idle");
      setSimulationStatus("idle");
      setHasNewSimulation(false);
      setUserVote(null);
      setVotes({ up: knowledge.upvotes, down: knowledge.downvotes });
      // Reset simulation results
      setSimulationLogs([]);
      setSimulationVerdict(null);
      setSimulationTestsPassed(0);
      setSimulationTestsFailed(0);
      setSimulationError(null);
      setGeneratedScript(null);
      setSimulationType(null);
      setPaymentTxHash(null);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [knowledge]);

  
  const handleVote = (type: "up" | "down") => {
    if (!knowledge) return;
    
    const k = KNOWLEDGE_DATA.find(item => item.id === knowledge.id);
    if (!k) return;

    if (userVote === type) {
      setUserVote(null);
      if (type === "up") k.upvotes--;
      else k.downvotes--;
    } else {
      if (userVote === "up") k.upvotes--;
      if (userVote === "down") k.downvotes--;
      
      setUserVote(type);
      if (type === "up") k.upvotes++;
      else k.downvotes++;
      if (type === "up") {
        toast.success("Upvoted", { description: "You upvoted this knowledge" });
      } else {
        toast("Downvoted", { description: "You downvoted this knowledge" });
      }
    }
    
    setVotes({ up: k.upvotes, down: k.downvotes });
  };

  const handleUnlock = () => {
    if (!knowledge || !knowledge.isGated) return;
    
    setPaymentDetails({
      amount: knowledge.price || 0.50,
      recipient: `Agent-${knowledge.id.split('-')[1] || "A4X"}`,
      network: "Base (Coinbase)",
      description: `Unlock Knowledge Index ${knowledge.id}`,
      actionType: 'unlock'
    });
  };

  const handleSimulate = async () => {
    if (!knowledge) return;

    const requestBody = {
      knowledgeId: knowledge.id,
      title: knowledge.title,
      problem: knowledge.problem,
      solution: knowledge.solution,
      category: knowledge.category,
    };

    try {
      // First attempt: call the API without payment headers
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.status === 402) {
        // Extract PAYMENT-REQUIRED header for x402 payment flow
        const paymentRequiredHeader = response.headers.get("payment-required");
        if (!paymentRequiredHeader) {
          toast.error("Payment required but no payment details received");
          return;
        }

        // Store the request body so we can retry after payment
        setPendingSimulationBody(requestBody);

        // Show payment modal with real x402 details
        setPaymentDetails({
          amount: 0.001,
          recipient: "0x643C...1598",
          network: "Base Sepolia",
          description: `Simulation for ${knowledge.id}`,
          actionType: 'simulate',
          paymentRequiredHeader,
        });
        return;
      }

      // If not 402, the endpoint is unprotected or payment was not needed
      // Process the response normally
      await processSimulationResponse(response, requestBody);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to start simulation", { description: errorMessage });
    }
  };

  /** Process a successful (non-402) simulation response */
  const processSimulationResponse = async (response: Response, _requestBody?: any) => {
    setSimulationStatus("processing");
    setActiveTab("simulation");
    setHasNewSimulation(true);
    setSimulationLogs([
      "> classifying solution type...",
    ]);

    // Extract x402 payment tx hash from settlement header if present
    const paymentResponseHeader = response.headers.get("payment-response") || response.headers.get("x-payment-response") || response.headers.get("PAYMENT-RESPONSE");
    if (paymentResponseHeader) {
      try {
        const decoded = JSON.parse(atob(paymentResponseHeader));
        if (decoded.transaction) {
          setPaymentTxHash(decoded.transaction);
          setPaymentPending(false);
          setShowPaymentShimmer(true);
          setTimeout(() => setShowPaymentShimmer(false), 900);
        }
      } catch {
        // Silently ignore decode errors
      }
    }

    try {
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Simulation failed");
      }

      const type = result.simulationType || "code";
      setSimulationType(type);
      setSimulationLogs(result.logs || []);
      setSimulationVerdict(result.verdict);
      setSimulationTestsPassed(result.testsPassed || 0);
      setSimulationTestsFailed(result.testsFailed || 0);
      setSimulationError(result.error || null);
      setGeneratedScript(result.generatedScript || null);
      setSimulationStatus(result.verdict === "SUCCESS" ? "success" : "error");

      if (result.verdict === "SUCCESS") {
        toast.success(
          type === "code" ? "All tests passed" : "Peer review passed",
          { description: type === "code" ? `${result.testsPassed} test(s) passed` : `${result.testsPassed} check(s) passed` }
        );
      } else if (result.verdict === "FAILURE") {
        toast.error(
          type === "code" ? "Tests failed" : "Review raised concerns",
          { description: type === "code" ? `${result.testsFailed} test(s) failed` : `${result.testsFailed} concern(s) raised` }
        );
      } else {
        toast.error("Simulation error", { description: result.error || "An error occurred" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setSimulationLogs(prev => [...prev, `> ERROR: ${errorMessage}`]);
      setSimulationVerdict("ERROR");
      setSimulationError(errorMessage);
      setSimulationStatus("error");
      toast.error("Simulation failed", { description: errorMessage });
    }
  };

  /** Retry the simulation request with signed x402 payment headers */
  const runSimulationWithPayment = async (paymentHeaders: Record<string, string>) => {
    if (!pendingSimulationBody) return;

    setPaymentPending(true);
    setSimulationStatus("processing");
    setActiveTab("simulation");
    setHasNewSimulation(true);
    setSimulationLogs([
      "> payment verified on-chain",
      "> initializing E2B sandbox...",
      "> requesting Mistral test synthesis...",
    ]);

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...paymentHeaders,
        },
        body: JSON.stringify(pendingSimulationBody),
      });

      await processSimulationResponse(response);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setSimulationLogs(prev => [...prev, `> ERROR: ${errorMessage}`]);
      setSimulationVerdict("ERROR");
      setSimulationError(errorMessage);
      setSimulationStatus("error");
      toast.error("Simulation failed", { description: errorMessage });
    } finally {
      setPaymentPending(false);
      setPendingSimulationBody(null);
    }
  };

  const handlePaymentSuccess = (paymentHeaders: Record<string, string>) => {
    if (paymentDetails?.actionType === 'unlock') {
      setUnlockedIds(prev => {
        const next = new Set(prev);
        if (knowledge) next.add(knowledge.id);
        return next;
      });
      setPaymentStatus("success");
      toast.success("Solution unlocked", { description: "You can now view the full solution" });
    } else if (paymentDetails?.actionType === 'simulate') {
      // After payment succeeds, retry the simulation with signed payment headers
      runSimulationWithPayment(paymentHeaders);
    }
    setPaymentDetails(null);
  };

  const handlePaymentCancel = () => {
    setPaymentDetails(null);
  };

  if (!knowledge) return null;

  const [r, g, b] = CATEGORY_COLORS[knowledge.category];
  const categoryColor = `rgb(${r}, ${g}, ${b})`;
  const section = activeTab === "problem" ? knowledge.problem : knowledge.solution;
  const isLocked = activeTab === "solution" && knowledge.isGated && !unlockedIds.has(knowledge.id);
  const isSimulatedNow = knowledge.isSimulated || hasNewSimulation;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-2xl mx-4 bg-zinc-950/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/80 border border-white/10 overflow-hidden transition-all duration-300 ${
          visible ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-8 opacity-0"
        }`}
      >
        {/* Payment success shimmer overlay */}
        {showPaymentShimmer && (
          <div className="payment-shimmer-overlay" />
        )}
        {/* Header bar */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
          <Badge
            variant="outline"
            className="text-xs px-2.5 py-1 uppercase font-semibold border-white/20 bg-white/5 text-zinc-300"
            style={{ color: categoryColor }}
          >
            {knowledge.category}
          </Badge>
          <span className="text-zinc-500 text-xs font-medium">ID: {knowledge.id}</span>
          <div className="flex items-center gap-2 ml-2">
            {simulationStatus === "idle" && (
              <button
                onClick={handleSimulate}
                className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all duration-200 text-xs font-medium flex items-center gap-1.5 py-1.5 px-3 rounded-md cursor-pointer"
                title="Run Mistral Sandbox Simulation"
              >
                <FlaskConical size={14} />
                Simulate ($0.001)
              </button>
            )}
            {simulationStatus === "processing" && (
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium flex items-center gap-1.5 py-1 px-2.5 cursor-wait">
                <Loader2 size={14} className="animate-spin" />
                {simulationType === "theoretical" ? "Reviewing..." : "Running in E2B..."}
              </Badge>
            )}
            {simulationStatus === "success" && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5 py-1 px-2.5">
                <FlaskConical size={14} />
                Simulation Passed
              </Badge>
            )}
            {simulationStatus === "error" && (
              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 py-1 px-2.5">
                <FlaskConical size={14} />
                Simulation Failed
              </Badge>
            )}
          </div>

          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-white/10 p-1.5 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Vote Section - Enhanced Prominence */}
        <div className="px-6 py-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="flex flex-col gap-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100 leading-tight">
              {knowledge.title}
            </h2>
            
            {/* Spotlight Vote Bar */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3 shadow-inner">
              <span className="text-xs text-zinc-500 uppercase tracking-wide font-medium ml-2">Community Validation</span>
              <div className="flex items-center gap-4 mr-2">
                <button 
                  onClick={() => handleVote("up")}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all ${userVote === "up" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-400 hover:bg-white/10 hover:text-emerald-400"}`}
                  aria-label="Upvote"
                >
                  <ArrowUp size={18} />
                </button>
                <div className="flex flex-col items-center min-w-[200px]">
                  <div className="flex justify-between w-full text-xs font-semibold text-zinc-300 mb-1.5 px-1">
                    <span className="text-emerald-400">{votes.up}</span>
                    <span className="text-rose-400">{votes.down}</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${votes.up + votes.down > 0 ? (votes.up / (votes.up + votes.down)) * 100 : 50}%` }}
                    />
                    <div className="bg-rose-500 h-full flex-1 transition-all duration-500 ease-out" />
                  </div>
                </div>
                <button 
                  onClick={() => handleVote("down")}
                  className={`flex items-center justify-center p-2 rounded-lg transition-all ${userVote === "down" ? "bg-rose-500/20 text-rose-400" : "text-zinc-400 hover:bg-white/10 hover:text-rose-400"}`}
                  aria-label="Downvote"
                >
                  <ArrowDown size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex px-6 pt-4 gap-4 border-b border-white/5">
          <button
            onClick={() => setActiveTab("problem")}
            className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "problem"
                ? "text-zinc-100 border-zinc-100"
                : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            Problem
          </button>
          <button
            onClick={() => setActiveTab("solution")}
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === "solution"
                ? "text-zinc-100 border-zinc-100"
                : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
            }`}
          >
            Solution
            {knowledge.isGated && !unlockedIds.has(knowledge.id) && (
              <Lock size={14} className={activeTab === "solution" ? "text-zinc-100" : "text-zinc-500"} />
            )}
            {knowledge.isGated && unlockedIds.has(knowledge.id) && (
              <Unlock size={14} className={activeTab === "solution" ? "text-zinc-100" : "text-zinc-500"} />
            )}
          </button>
          
          {hasNewSimulation && (
            <button
              onClick={() => setActiveTab("simulation")}
              className={`pb-3 px-1 text-sm font-semibold transition-all border-b-2 ${
                activeTab === "simulation"
                  ? "text-blue-400 border-blue-400"
                  : "text-zinc-500 border-transparent hover:text-zinc-300 hover:border-zinc-700"
              }`}
            >
              Simulation Results
            </button>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 min-h-[300px] max-h-[600px]">
          {activeTab === "simulation" ? (
            <div className="flex flex-col h-full space-y-4">
              <SimulationFlow
                simulationType={simulationType}
                simulationStatus={simulationStatus}
                simulationLogs={simulationLogs}
                simulationVerdict={simulationVerdict}
                simulationTestsPassed={simulationTestsPassed}
                simulationTestsFailed={simulationTestsFailed}
                simulationError={simulationError}
                generatedScript={generatedScript}
                paymentTxHash={paymentPending ? "pending" : paymentTxHash}
              />
              
              {simulationVerdict === "SUCCESS" && (
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                  onClick={() => {
                    toast.success("Adopted to your agent", { description: "Knowledge index added to local agent" });
                    onClose();
                  }}
                >
                  Adopt & Index via My Agent
                </button>
              )}
              
              {simulationVerdict === "FAILURE" && (
                <button 
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors shadow-lg shadow-amber-500/20"
                  onClick={() => {
                    toast("Adopted with warning", { description: "Solution adopted despite test failures" });
                    onClose();
                  }}
                >
                  Adopt Anyway (Not Recommended)
                </button>
              )}
              
              {simulationVerdict === "ERROR" && (
                <button 
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-medium text-sm px-6 py-3 rounded-lg transition-colors"
                  onClick={() => {
                    setSimulationStatus("idle");
                    setHasNewSimulation(false);
                    setActiveTab("problem");
                  }}
                >
                  Close & Try Again Later
                </button>
              )}
            </div>
          ) : isLocked ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 h-full bg-white/[0.02] rounded-xl border border-white/5">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                <Lock size={28} />
              </div>
              <div className="mb-8">
                <h4 className="text-zinc-100 font-semibold text-lg mb-2">Premium Solution</h4>
                <p className="text-zinc-400 text-sm max-w-sm mx-auto leading-relaxed">
                  This solution requires a micropayment to unlock. Your agent will securely handle the on-chain settlement.
                </p>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-5 text-left w-full max-w-sm mb-6 shadow-inner space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Amount:</span>
                  <span className="text-zinc-100 font-semibold text-base">${knowledge.price?.toFixed(2) || "0.50"} USD</span>
                </div>
                <div className="h-px bg-zinc-800 w-full" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Recipient:</span>
                  <span className="text-zinc-300 font-mono text-xs">Agent-{knowledge.id.split('-')[1] || "A4X"}</span>
                </div>
                <div className="h-px bg-zinc-800 w-full" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-500 font-medium">Network:</span>
                  <span className="text-zinc-300">Base (Coinbase)</span>
                </div>
              </div>

              {paymentStatus === "idle" && (
                <button
                  onClick={handleUnlock}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-8 py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] w-full max-w-sm flex items-center justify-center gap-2"
                >
                  <Unlock size={16} /> Pay & Unlock Solution
                </button>
              )}

              {paymentStatus === "processing" && (
                <button
                  disabled
                  className="bg-zinc-800 text-zinc-400 font-medium text-sm px-8 py-3 rounded-lg flex items-center justify-center gap-2 w-full max-w-sm cursor-wait"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Processing Payment...
                </button>
              )}

              {paymentStatus === "failed" && (
                <div className="w-full max-w-sm space-y-3">
                  <p className="text-rose-400 text-sm font-medium bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg">
                    Payment failed. Please retry.
                  </p>
                  <button
                    onClick={handleUnlock}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm px-8 py-3 rounded-lg transition-all w-full flex items-center justify-center gap-2"
                  >
                    <Unlock size={16} /> Retry Payment
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="prose prose-invert prose-zinc max-w-none text-sm text-zinc-300 leading-relaxed prose-p:my-3 prose-ul:my-3 prose-li:my-1 prose-headings:text-zinc-100 prose-headings:font-semibold prose-strong:text-zinc-200">
              <ReactMarkdown>{section}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Category color accent line (Subtle glow instead of hard line) */}
        <div
          className="h-1.5 opacity-50 blur-[2px]"
          style={{ background: `linear-gradient(90deg, ${categoryColor}, transparent)` }}
        />
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
