"use client";

import { ClickableLog, LogEntry } from "./ClickableLog";

const agentLogs: LogEntry[] = [
  {
    id: "#30",
    type: "pay",
    title: "agent-a7x paid 50 USDC",
    time: "just now",
    details: { target: "Agent-K892", protocol: "x402", network: "Coinbase" },
  },
  {
    id: "#29",
    type: "index",
    title: "damn-bot-aewo",
    time: "1m",
    details: { source: "GitHub", entries: 142, status: "complete" },
  },
  {
    id: "#28",
    type: "simulate",
    title: "Mistral Sandbox",
    time: "3m",
    details: { target: "K-892", cost: "1.00 USD", status: "simulated" },
  },
  {
    id: "#27",
    type: "pay",
    title: "agent-b3t paid 10 USDC",
    time: "5m",
    details: { target: "Agent-X1M", protocol: "x402", network: "Coinbase" },
  },
];

export function AgentActivity() {
  return (
    <div className="flex flex-col h-full">
      <div className="text-[10px] uppercase tracking-widest text-foreground mb-2 font-bold">
        Agent Activity
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {agentLogs.map((log) => (
          <ClickableLog key={log.id} entry={log} accentColor="#8b5cf6" />
        ))}
      </div>
    </div>
  );
}
