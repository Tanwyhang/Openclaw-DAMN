"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Database, 
  FlaskConical, 
  Zap, 
  CheckCircle2, 
  Circle, 
  Loader2,
  ExternalLink,
  Activity,
} from "lucide-react";

type WorkflowStepId = "index" | "store" | "simulate" | "apply";

type WorkflowStep = {
  id: WorkflowStepId;
  name: string;
  description: string;
  status: "pending" | "active" | "completed";
  icon: React.ReactNode;
};

interface AgentWorkflowProps {
  onStepChange?: (step: WorkflowStepId) => void;
}

export function AgentWorkflow({ onStepChange }: AgentWorkflowProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: "index",
      name: "Indexing",
      description: "Scanning knowledge sources",
      status: "completed",
      icon: <Search size={18} />,
    },
    {
      id: "store",
      name: "Storing",
      description: "Persisting to DAMN network",
      status: "completed",
      icon: <Database size={18} />,
    },
    {
      id: "simulate",
      name: "Simulating",
      description: "Running E2B sandbox",
      status: "active",
      icon: <FlaskConical size={18} />,
    },
    {
      id: "apply",
      name: "Applying",
      description: "Executing knowledge actions",
      status: "pending",
      icon: <Zap size={18} />,
    },
  ]);

  const [agentStats] = useState({
    address: "0x8a4B...3f2E",
    fullAddress: "0x8a4B9c7D1e2F3a4B5c6D7e8F9a0B1c2D3e4F3f2E",
    balance: "1,240 USDC",
    transactions: "847",
    uptime: "99.7%",
    lastActive: "2m ago",
    knowledge: "12",
    simulations: "234",
  });

  const [isHovered, setIsHovered] = useState(false);

  // Get step color based on step id
  const getStepColor = (stepId: WorkflowStepId) => {
    switch (stepId) {
      case "index": return "#3b82f6"; // blue
      case "store": return "#8b5cf6"; // purple
      case "simulate": return "#f97316"; // orange
      case "apply": return "#10b981"; // emerald
      default: return "#3b82f6";
    }
  };

  // Notify parent of step changes
  useEffect(() => {
    const activeStep = steps.find((s) => s.status === "active");
    if (activeStep && onStepChange) {
      onStepChange(activeStep.id);
    }
  }, [steps, onStepChange]);

  // Simulate workflow progression
  useEffect(() => {
    const interval = setInterval(() => {
      setSteps((prev) => {
        const activeIdx = prev.findIndex((s) => s.status === "active");
        if (activeIdx === -1 || activeIdx === prev.length - 1) {
          return prev.map((s, i) => ({
            ...s,
            status: i === 0 ? "active" : "pending",
          }));
        }
        return prev.map((s, i) => ({
          ...s,
          status:
            i < activeIdx + 1 ? "completed" : i === activeIdx + 1 ? "active" : "pending",
        }));
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getStepIcon = (step: WorkflowStep) => {
    if (step.status === "completed") {
      return <CheckCircle2 size={14} className="text-emerald-500" />;
    }
    if (step.status === "active") {
      return <Loader2 size={14} className="text-blue-600 animate-spin" />;
    }
    return <Circle size={14} className="text-slate-300" />;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Workflow Status Section - compact header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-100">
        {/* Current step label */}
        <div className="text-center mb-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Currently</p>
          <h3 
            className="text-base font-bold transition-colors duration-300"
            style={{ color: getStepColor(steps.find(s => s.status === "active")?.id || "index") }}
          >
            {steps.find(s => s.status === "active")?.name || "Idle"}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {steps.find(s => s.status === "active")?.description}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  step.status === "active"
                    ? "ring-2 ring-offset-1 scale-110 shadow-md"
                    : step.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-400"
                }`}
                style={{
                  backgroundColor: step.status === "active" ? getStepColor(step.id) : undefined,
                  color: step.status === "active" ? "white" : undefined,
                  ["--tw-ring-color" as string]: step.status === "active" ? getStepColor(step.id) + "40" : undefined,
                }}
              >
                {step.status === "completed" ? (
                  <CheckCircle2 size={14} />
                ) : (
                  step.icon
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`w-6 h-0.5 mx-1 rounded-full transition-all ${
                    step.status === "completed" ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ERC-8004 Identity Card - Original airpod style with hover expand */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div 
          className="relative flex items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Main Airpod */}
          <div className="bg-[#e8e9eb] rounded-[40px] px-6 py-8 shadow-[inset_0px_35px_25px_#ffffffe0,inset_10px_0px_25px_#0000004b,inset_40px_0px_20px_#ffffff,inset_-10px_0px_25px_#0000004b,inset_-40px_0px_20px_#fff,inset_0px_10px_10px_#000000e0,inset_0px_-15px_25px_#00000036,10px_25px_40px_-10px_#00000060] w-56 z-10 relative transition-all duration-300">
            <div className="text-center mb-4">
              <h3 className="text-xs font-bold text-slate-700">ERC-8004</h3>
              <p className="text-[10px] text-slate-500">Agent Protocol</p>
            </div>
            <div className="mt-2">
              <div className="bg-gradient-to-b from-[#d6d6d6] to-white rounded-xl p-3 text-center">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-0.5">Address</span>
                <a
                  href={`https://socialscan.io/address/${agentStats.fullAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {agentStats.address}
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
            {/* LED indicator */}
            <div className="flex justify-center mt-5">
              <div className="w-2 h-2 rounded-full bg-[#66f66f] shadow-[0_0_6px_#3eff4b]"></div>
            </div>
          </div>

          {/* Sliding Stats Panel - slides out to the right */}
          <div 
            className={`absolute left-full top-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
              isHovered ? "opacity-100 translate-x-4" : "opacity-0 -translate-x-8 pointer-events-none"
            }`}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-4 w-44">
              <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-3">Agent Stats</h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Balance</span>
                  <span className="text-[11px] font-semibold text-slate-700">{agentStats.balance}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Transactions</span>
                  <span className="text-[11px] font-semibold text-slate-700">{agentStats.transactions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Uptime</span>
                  <span className="text-[11px] font-semibold text-emerald-600">{agentStats.uptime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Last Active</span>
                  <span className="text-[11px] font-semibold text-slate-700">{agentStats.lastActive}</span>
                </div>
                <div className="h-px bg-slate-100 my-1"></div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Knowledge</span>
                  <span className="text-[11px] font-semibold text-blue-600">{agentStats.knowledge}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">Simulations</span>
                  <span className="text-[11px] font-semibold text-slate-700">{agentStats.simulations}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
