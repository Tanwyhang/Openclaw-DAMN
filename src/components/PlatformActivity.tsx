"use client";

import { ClickableLog, LogEntry } from "./ClickableLog";

const platformLogs: LogEntry[] = [
  {
    id: "#13",
    type: "sandbox",
    title: "Mistral Simulation Completed",
    time: "just now",
    knowledgeId: "K-001",
    details: { 
      source: "Relay Engine", 
      status: "success",
      cost: "1.00 USD",
      description: "Mistral AI Sandbox isolated environment confirmed 0 regressions for solution K-001"
    },
  },
  {
    id: "#12",
    type: "tx",
    title: "Network Snapshot",
    time: "2m",
    knowledgeId: "K-004",
    details: { 
      source: "Base L2", 
      entries: 1402, 
      status: "confirmed",
      description: "Knowledge base snapshot committed to decentralized storage"
    },
  },
  {
    id: "#11",
    type: "event",
    title: "Knowledge Conflict Detected",
    time: "1h",
    knowledgeId: "K-015",
    details: { 
      source: "Relay Engine", 
      status: "pending",
      description: "Duplicate resolution found for N+1 query pattern — requires manual review"
    },
  }
];

interface PlatformActivityProps {
  onLogClick?: (knowledgeId: string) => void;
}

export function PlatformActivity({ onLogClick }: PlatformActivityProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="text-[10px] uppercase tracking-widest text-white/70 mb-2 font-bold">
        Platform Activity
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {platformLogs.map((log) => (
          <ClickableLog
            key={log.id}
            entry={log}
            clickable
            accentColor="#fbbf24"
            onNavigate={onLogClick}
          />
        ))}
      </div>
    </div>
  );
}
