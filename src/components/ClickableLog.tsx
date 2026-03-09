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

export function ClickableLog({ entry, clickable = false, accentColor = "#8b5cf6", onNavigate }: ClickableLogProps) {
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
          ? "border-border hover:border-primary cursor-pointer hover:bg-primary/5 hover:shadow-sm"
          : "border-border hover:border-primary/50 cursor-pointer"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2 p-2.5 bg-white">
        <span className="text-foreground text-[10px] font-mono w-6 font-medium">{entry.id}</span>
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
        <span className="text-xs font-mono flex-1 truncate text-foreground">{entry.title}</span>
        <span className="text-foreground/70 text-[10px] font-medium">{entry.time}</span>
        {clickable && (
          <span
            className="text-xs font-bold transition-transform duration-200"
            style={{ color: accentColor, transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            {">"}
          </span>
        )}
        {!clickable && (
          <span className="text-foreground/70 text-[10px] font-medium">{expanded ? "-" : "+"}</span>
        )}
      </div>
      {expanded && entry.details && (
        <div className="px-2.5 pb-2.5 pt-1.5 bg-muted border-t border-border space-y-1.5">
          {entry.details.description && (
            <p className="text-[10px] text-foreground">{entry.details.description}</p>
          )}
          {entry.details.source && (
            <div className="flex justify-between">
              <span className="text-[10px] text-foreground/70 font-medium">Source</span>
              <span className="text-[10px] font-mono text-foreground">{entry.details.source}</span>
            </div>
          )}
          {entry.details.entries !== undefined && (
            <div className="flex justify-between">
              <span className="text-[10px] text-foreground/70 font-medium">Entries</span>
              <span className="text-[10px] font-mono text-foreground">{entry.details.entries}</span>
            </div>
          )}
          {entry.details.status && (
            <div className="flex justify-between">
              <span className="text-[10px] text-foreground/70 font-medium">Status</span>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-[9px] px-1.5 py-0">
                {entry.details.status}
              </Badge>
            </div>
          )}
          {entry.knowledgeId && (
            <div className="flex justify-between items-center pt-1 border-t border-border">
              <span className="text-[10px] text-foreground/70 font-medium">Knowledge</span>
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
