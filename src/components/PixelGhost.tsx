"use client";

import "./PixelGhost.css";
import type { Knowledge } from "@/data/knowledge";

export type GhostState = "idle" | "indexing" | "storing" | "simulating" | "applying";

interface PixelGhostProps {
  color?: string;
  state?: GhostState;
  style?: React.CSSProperties;
  knowledge?: Knowledge | null;
  showBubble?: boolean;
}

export function PixelGhost({ 
  color = "#3b82f6", 
  state = "idle", 
  style,
  knowledge,
  showBubble = false,
}: PixelGhostProps) {
  const isFlying = state === "indexing" || state === "storing";
  const isInspecting = state === "indexing";

  const getBubbleMessage = () => {
    if (!knowledge) return null;
    
    switch (state) {
      case "indexing":
        return (
          <div className="ghost-bubble">
            <div className="bubble-header">
              <span className="bubble-category" style={{ color }}>{knowledge.category}</span>
              <span className="bubble-id">{knowledge.id}</span>
            </div>
            <p className="bubble-title">{knowledge.title}</p>
            <div className="bubble-stats">
              <span className="stat">+{knowledge.upvotes}</span>
              <span className="stat">-{knowledge.downvotes}</span>
              {knowledge.isGated && <span className="stat gated">${knowledge.price}</span>}
            </div>
            <div className="bubble-action">Scanning...</div>
          </div>
        );
      case "storing":
        return (
          <div className="ghost-bubble storing">
            <div className="bubble-action">Persisting to DAMN...</div>
            <div className="bubble-progress">
              <div className="progress-bar" style={{ backgroundColor: color }}></div>
            </div>
          </div>
        );
      case "simulating":
        return (
          <div className="ghost-bubble simulating">
            <div className="bubble-action">Running E2B sandbox...</div>
            <div className="bubble-code">
              <code>{">"} verify({knowledge.id})</code>
            </div>
          </div>
        );
      case "applying":
        return (
          <div className="ghost-bubble applying">
            <div className="bubble-action">Applying knowledge...</div>
            <div className="bubble-success">Ready</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`ghost-container ${isFlying ? "flying" : ""} ${isInspecting ? "inspecting" : ""}`}
      style={style}
    >
      {/* Chat bubble */}
      {showBubble && knowledge && (
        <div className="ghost-bubble-wrapper">
          {getBubbleMessage()}
        </div>
      )}
      
      <div id="ghost">
        <div id="red" style={{ "--ghost-color": color } as React.CSSProperties}>
          <div id="top0"></div>
          <div id="top1"></div>
          <div id="top2"></div>
          <div id="top3"></div>
          <div id="top4"></div>
          <div id="st0"></div>
          <div id="st1"></div>
          <div id="st2"></div>
          <div id="st3"></div>
          <div id="st4"></div>
          <div id="st5"></div>
          <div id="an1"></div>
          <div id="an2"></div>
          <div id="an3"></div>
          <div id="an4"></div>
          <div id="an5"></div>
          <div id="an6"></div>
          <div id="an7"></div>
          <div id="an8"></div>
          <div id="an9"></div>
          <div id="an10"></div>
          <div id="an11"></div>
          <div id="an12"></div>
          <div id="an13"></div>
          <div id="an14"></div>
          <div id="an15"></div>
          <div id="an16"></div>
          <div id="an17"></div>
          <div id="an18"></div>
          <div id="eye"></div>
          <div id="eye1"></div>
          <div id="pupil"></div>
          <div id="pupil1"></div>
        </div>
        <div id="shadow"></div>
      </div>
    </div>
  );
}
