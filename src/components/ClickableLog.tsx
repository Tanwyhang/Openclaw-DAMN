"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export interface LogEntry {
  id: string;
  type: string;
  title: string;
  time: string;
  knowledgeId?: string;
  details?: {
    source?: string;
    entries?: number;
    status?: string;
    description?: string;
    target?: string;
    protocol?: string;
    network?: string;
    cost?: string;
  };
}

interface ClickableLogProps {
  entry: LogEntry;
  clickable?: boolean;
  accentColor?: string;
  onNavigate?: (knowledgeId: string) => void;
}

export function ClickableLog({ entry, clickable = false, accentColor = "#fde047", onNavigate }: ClickableLogProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (entry.knowledgeId && onNavigate) {
      // Navigate to the knowledge dot on the sphere — don't expand
      onNavigate(entry.knowledgeId);
    } else {
      // No linked knowledge — toggle expand as fallback
      setExpanded(!expanded);
    }
  };

  return (
    <div
      className={`border rounded-md overflow-hidden transition-all duration-200 ${
        clickable
          ? "border-white/20 hover:border-white/40 cursor-pointer hover:bg-white/5 hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]"
          : "border-white/10 hover:border-white/20 cursor-pointer"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 p-2.5 bg-black/40">
        <span className="text-white/70 text-[10px] font-mono w-6">{entry.id}</span>
        <Badge
          variant="outline"
          className="text-[9px] px-1.5 py-0"
          style={{
            borderColor: `${accentColor}50`,
            color: accentColor,
          }}
        >
          {entry.type}
        </Badge>
        <span className="text-xs font-mono flex-1 truncate">{entry.title}</span>
        <span className="text-white/70 text-[10px]">{entry.time}</span>
        {clickable && (
          <span
            className="text-xs font-bold transition-transform duration-200"
            style={{ color: accentColor, transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            {">"}
          </span>
        )}
        {!clickable && (
          <span className="text-white/70 text-[10px]">{expanded ? "-" : "+"}</span>
        )}
      </div>
      {expanded && entry.details && (
        <div className="px-2.5 pb-2.5 pt-1.5 bg-black/60 border-t border-white/5 space-y-1.5">
          {entry.details.description && (
            <p className="text-[10px] text-white/70">{entry.details.description}</p>
          )}
          {entry.details.source && (
            <div className="flex justify-between">
              <span className="text-[10px] text-white/70">Source</span>
              <span className="text-[10px] font-mono">{entry.details.source}</span>
            </div>
          )}
          {entry.details.entries !== undefined && (
            <div className="flex justify-between">
              <span className="text-[10px] text-white/70">Entries</span>
              <span className="text-[10px] font-mono">{entry.details.entries}</span>
            </div>
          )}
          {entry.details.status && (
            <div className="flex justify-between">
              <span className="text-[10px] text-white/70">Status</span>
              <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 text-[9px] px-1.5 py-0">
                {entry.details.status}
              </Badge>
            </div>
          )}
          {entry.knowledgeId && (
            <div className="flex justify-between items-center pt-1 border-t border-white/5">
              <span className="text-[10px] text-white/50">Knowledge</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded border"
                style={{ borderColor: `${accentColor}40`, color: accentColor }}
              >
                {entry.knowledgeId}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
