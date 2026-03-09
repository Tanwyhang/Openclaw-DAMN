"use client";

import { useState, useEffect } from "react";
import { Terminal, X, CheckCircle2, Loader2, Box } from "lucide-react";
import type { Knowledge } from "@/data/knowledge";

interface E2BSandboxModalProps {
  isOpen: boolean;
  knowledge: Knowledge | null;
  onClose?: () => void;
  style?: React.CSSProperties;
}

const MOCK_OUTPUTS = [
  { type: "system", text: "Initializing E2B sandbox environment..." },
  { type: "system", text: "Allocating isolated container..." },
  { type: "success", text: "Container ready (256MB RAM, 1 vCPU)" },
  { type: "command", text: "$ load_knowledge --id {ID}" },
  { type: "output", text: "Loading knowledge artifact..." },
  { type: "success", text: "Knowledge loaded successfully" },
  { type: "command", text: "$ verify --check-integrity" },
  { type: "output", text: "Verifying solution integrity..." },
  { type: "output", text: "Running static analysis..." },
  { type: "output", text: "Checking for side effects..." },
  { type: "success", text: "All checks passed" },
  { type: "command", text: "$ simulate --dry-run" },
  { type: "output", text: "Simulating execution in sandbox..." },
  { type: "output", text: "No harmful patterns detected" },
  { type: "success", text: "Simulation complete - Safe to apply" },
];

export function E2BSandboxModal({ isOpen, knowledge, onClose, style }: E2BSandboxModalProps) {
  const [outputs, setOutputs] = useState<typeof MOCK_OUTPUTS>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setOutputs([]);
      setIsComplete(false);
      return;
    }

    // Reset and start animation
    setOutputs([]);
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < MOCK_OUTPUTS.length) {
        const output = MOCK_OUTPUTS[index];
        // Replace {ID} with actual knowledge ID
        const text = output.text.replace("{ID}", knowledge?.id || "K-XXX");
        setOutputs((prev) => [...prev, { ...output, text }]);
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen, knowledge?.id]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-[200] animate-in fade-in slide-in-from-left-4 duration-300"
      style={style}
    >
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(249,115,22,0.15),0_0_0_1px_rgba(255,255,255,0.1)] border border-white/10 w-80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Box size={14} className="text-orange-400" />
            <span className="text-xs font-bold text-white">E2B Sandbox</span>
            {!isComplete && (
              <Loader2 size={12} className="text-orange-400 animate-spin" />
            )}
            {isComplete && (
              <CheckCircle2 size={12} className="text-emerald-400" />
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Terminal content */}
        <div className="p-3 h-64 overflow-y-auto font-mono text-[11px] leading-relaxed">
          {outputs.map((output, idx) => (
            <div
              key={idx}
              className={`mb-1 animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                output.type === "system"
                  ? "text-slate-400"
                  : output.type === "command"
                  ? "text-cyan-400"
                  : output.type === "success"
                  ? "text-emerald-400"
                  : "text-slate-300"
              }`}
            >
              {output.type === "success" && (
                <span className="text-emerald-500 mr-1">✓</span>
              )}
              {output.text}
            </div>
          ))}
          
          {/* Cursor */}
          {!isComplete && (
            <span className="inline-block w-2 h-4 bg-orange-400 animate-pulse" />
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 size={14} />
                <span className="font-semibold">Sandbox verification complete</span>
              </div>
              {knowledge && (
                <p className="text-slate-500 text-[10px] mt-1">
                  Knowledge {knowledge.id} is safe to apply
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isComplete ? "bg-emerald-500" : "bg-orange-500 animate-pulse"}`} />
            <span className="text-[10px] text-slate-400">
              {isComplete ? "Verified" : "Running..."}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            e2b.dev
          </span>
        </div>
      </div>
    </div>
  );
}
