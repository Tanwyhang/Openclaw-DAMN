"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  Cpu,
  Sparkles,
  Search,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  MessageSquare,
  Shield,
  BookOpen,
  Eye,
  Wallet,
  ExternalLink,
  X,
  Maximize2,
  Copy,
  Check,
} from "lucide-react";
import Image from "next/image";

const MistralLogo = () => (
  <Image src="/mistral.png" alt="Mistral AI" width={18} height={18} className="rounded-sm" />
);

// ============================================================================
// Types
// ============================================================================

type NodeStatus = "idle" | "running" | "success" | "error" | "warning";

interface FlowNode {
  id: string;
  label: string;
  sublabel?: string;
  status: NodeStatus;
  icon: React.ReactNode;
  content?: string[];
  expandable?: boolean;
  expandedContent?: string;
  /** URL to link the sublabel to (opens in new tab) */
  link?: string;
  // Grid position (col, row) — 0-indexed
  col: number;
  row: number;
}

interface FlowEdge {
  from: string;
  to: string;
}

// ============================================================================
// Layout constants
// ============================================================================

const NODE_W = 152;
const NODE_H = 56;
const COL_GAP = 32;
const ROW_GAP = 40;
const PAD_X = 16;
const PAD_Y = 12;

function nodeX(col: number) {
  return PAD_X + col * (NODE_W + COL_GAP);
}
function nodeY(row: number) {
  return PAD_Y + row * (NODE_H + ROW_GAP);
}

// ============================================================================
// Build nodes + edges from simulation state
// ============================================================================

export interface SimulationFlowProps {
  simulationType: "code" | "theoretical" | null;
  simulationStatus: "idle" | "processing" | "success" | "error";
  simulationLogs: string[];
  simulationVerdict: "SUCCESS" | "FAILURE" | "ERROR" | null;
  simulationTestsPassed: number;
  simulationTestsFailed: number;
  simulationError: string | null;
  generatedScript: string | null;
  paymentTxHash: string | null;
}

function statusOf(done: boolean, isNext: boolean, isProcessing: boolean): NodeStatus {
  if (done) return "success";
  if (isNext && isProcessing) return "running";
  return "idle";
}

const BASESCAN_SEPOLIA = "https://sepolia.basescan.org/tx/";

function truncateHash(hash: string): string {
  if (hash === "pending") return "settling...";
  if (hash.length <= 14) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function paymentNode(paymentTxHash: string, col: number, row: number): FlowNode {
  const isPending = paymentTxHash === "pending";
  return {
    id: "payment",
    label: "Payment",
    sublabel: truncateHash(paymentTxHash),
    status: isPending ? "running" : "success",
    icon: <Wallet size={16} />,
    content: isPending
      ? ["x402 settling on Base Sepolia..."]
      : [`x402 settled on Base Sepolia`, `Tx: ${paymentTxHash}`],
    link: isPending ? undefined : `${BASESCAN_SEPOLIA}${paymentTxHash}`,
    col,
    row,
  };
}

function buildCodeFlow(props: SimulationFlowProps): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const {
    simulationType,
    simulationStatus,
    simulationLogs,
    simulationVerdict,
    simulationTestsPassed,
    simulationTestsFailed,
    simulationError,
    generatedScript,
    paymentTxHash,
  } = props;

  const isProcessing = simulationStatus === "processing";
  const classified = simulationType !== null;
  const hasScript = !!generatedScript;
  const hasExecOutput =
    simulationLogs.some((l) => l.includes("[PASS]") || l.includes("[FAIL]") || l.includes("[SETUP]") || l.includes("[TEST]") || l.includes("TESTS:")) ||
    !!simulationError;
  const hasVerdict = simulationVerdict !== null;

  // If payment was made, prepend a payment node and shift columns
  const paid = !!paymentTxHash;
  const off = paid ? 1 : 0;

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  if (paid) {
    nodes.push(paymentNode(paymentTxHash!, 0, 0));
    edges.push({ from: "payment", to: "mistral" });
  }

  nodes.push(
    {
      id: "mistral",
      label: "Mistral AI",
      sublabel: "ministral-14b-2512",
      status: isProcessing || hasVerdict ? "success" : "idle",
      icon: <MistralLogo />,
      col: 0 + off,
      row: 0,
    },
    {
      id: "classify",
      label: "Classify",
      sublabel: classified ? "code" : undefined,
      status: statusOf(classified, !classified, isProcessing),
      icon: <Search size={16} />,
      content: classified ? ["Detected: Code-based solution", "Route: Sandbox execution"] : undefined,
      col: 1 + off,
      row: 0,
    },
    {
      id: "generate",
      label: "Generate Tests",
      sublabel: hasScript ? `${generatedScript!.split("\n").length} lines` : undefined,
      status: statusOf(hasScript, classified && !hasScript, isProcessing),
      icon: <FileCode size={16} />,
      content: hasScript ? [`Generated via Codestral`] : undefined,
      expandable: hasScript,
      expandedContent: generatedScript || undefined,
      col: 2 + off,
      row: 0,
    },
    {
      id: "execute",
      label: "Run Sandbox",
      sublabel: hasExecOutput ? `${simulationTestsPassed}P ${simulationTestsFailed}F` : undefined,
      status: simulationError
        ? "error"
        : hasExecOutput
        ? simulationTestsFailed > 0
          ? "warning"
          : "success"
        : statusOf(false, hasScript && !hasExecOutput, isProcessing),
      icon: <Play size={16} />,
      content: hasExecOutput
        ? simulationLogs.filter(
            (l) => l.includes("[PASS]") || l.includes("[FAIL]") || l.includes("[SETUP]") || l.includes("[TEST]") || l.includes("TESTS:")
          )
        : undefined,
      col: 2 + off,
      row: 1,
    },
    {
      id: "verdict",
      label: "Verdict",
      sublabel: hasVerdict ? simulationVerdict! : undefined,
      status: hasVerdict ? (simulationVerdict === "SUCCESS" ? "success" : "error") : "idle",
      icon: hasVerdict
        ? simulationVerdict === "SUCCESS"
          ? <CheckCircle2 size={16} />
          : <XCircle size={16} />
        : <BookOpen size={16} />,
      content: hasVerdict
        ? [
            simulationVerdict === "SUCCESS"
              ? `${simulationTestsPassed} test(s) passed`
              : simulationVerdict === "FAILURE"
              ? `${simulationTestsPassed} passed, ${simulationTestsFailed} failed`
              : simulationError || "Error occurred",
          ]
        : undefined,
      col: 3 + off,
      row: 0,
    },
  );

  edges.push(
    { from: "mistral", to: "classify" },
    { from: "classify", to: "generate" },
    { from: "generate", to: "execute" },
    { from: "execute", to: "verdict" },
    { from: "generate", to: "verdict" },
  );

  return { nodes, edges };
}

function buildTheoreticalFlow(props: SimulationFlowProps): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const {
    simulationType,
    simulationStatus,
    simulationLogs,
    simulationVerdict,
    simulationTestsPassed,
    simulationTestsFailed,
    simulationError,
    paymentTxHash,
  } = props;

  const isProcessing = simulationStatus === "processing";
  const classified = simulationType !== null;
  const hasReview = simulationLogs.length > 0;

  const checkLines = simulationLogs.filter((l) => l.includes("[CHECK]"));
  const strengthLines = simulationLogs.filter((l) => l.includes("[STRENGTH]"));
  const concernLines = simulationLogs.filter((l) => l.includes("[CONCERN]"));
  const hasVerdict = simulationVerdict !== null;

  const paid = !!paymentTxHash;
  const off = paid ? 1 : 0;

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  if (paid) {
    nodes.push(paymentNode(paymentTxHash!, 0, 1));
    edges.push({ from: "payment", to: "mistral" });
  }

  nodes.push(
    {
      id: "mistral",
      label: "Mistral AI",
      sublabel: "ministral-14b-2512",
      status: isProcessing || hasVerdict ? "success" : "idle",
      icon: <MistralLogo />,
      col: 0 + off,
      row: 1,
    },
    {
      id: "classify",
      label: "Classify",
      sublabel: classified ? "theoretical" : undefined,
      status: statusOf(classified, !classified, isProcessing),
      icon: <Search size={16} />,
      content: classified ? ["Detected: Theoretical solution", "Route: Peer review"] : undefined,
      col: 1 + off,
      row: 1,
    },
    {
      id: "review",
      label: "Peer Review",
      sublabel: hasReview ? "analyzed" : undefined,
      status: statusOf(hasReview, classified && !hasReview, isProcessing),
      icon: <MessageSquare size={16} />,
      content: hasReview
        ? simulationLogs
            .filter(
              (l) =>
                !l.includes("[CHECK]") &&
                !l.includes("[STRENGTH]") &&
                !l.includes("[CONCERN]") &&
                !l.includes("[VERDICT]") &&
                !l.includes("[RESULT]")
            )
            .map((l) => l.replace(/\[REVIEW\]\s*/, "").replace(/\*\*/g, ""))
        : undefined,
      col: 2 + off,
      row: 1,
    },
  );

  // Branch nodes at col 3 — stack vertically starting at row 0
  let branchRow = 0;
  if (checkLines.length > 0) {
    nodes.push({
      id: "checks",
      label: "Checks",
      sublabel: `${checkLines.length} passed`,
      status: "success",
      icon: <Shield size={16} />,
      content: checkLines.map((l) => l.replace(/\[CHECK\]\s*/, "").replace(/\*\*/g, "")),
      col: 3 + off,
      row: branchRow++,
    });
  }
  if (strengthLines.length > 0) {
    nodes.push({
      id: "strengths",
      label: "Strengths",
      sublabel: `${strengthLines.length} found`,
      status: "success",
      icon: <Sparkles size={16} />,
      content: strengthLines.map((l) => l.replace(/\[STRENGTH\]\s*/, "").replace(/\*\*/g, "")),
      col: 3 + off,
      row: branchRow++,
    });
  }
  if (concernLines.length > 0) {
    nodes.push({
      id: "concerns",
      label: "Concerns",
      sublabel: `${concernLines.length} raised`,
      status: "warning",
      icon: <AlertTriangle size={16} />,
      content: concernLines.map((l) => l.replace(/\[CONCERN\]\s*/, "").replace(/\*\*/g, "")),
      col: 3 + off,
      row: branchRow++,
    });
  }

  const branchNodes = nodes.filter((n) => n.col === 3 + off);
  const verdictCol = branchNodes.length > 0 ? 4 + off : 3 + off;
  // Center verdict row among branches
  const verdictRow = branchNodes.length > 0 ? Math.floor((branchNodes.length - 1) / 2) : 1;

  nodes.push({
    id: "verdict",
    label: "Verdict",
    sublabel: hasVerdict ? simulationVerdict! : undefined,
    status: hasVerdict ? (simulationVerdict === "SUCCESS" ? "success" : "error") : "idle",
    icon: hasVerdict
      ? simulationVerdict === "SUCCESS"
        ? <CheckCircle2 size={16} />
        : <XCircle size={16} />
      : <BookOpen size={16} />,
    content: hasVerdict
      ? [
          simulationVerdict === "SUCCESS"
            ? `${simulationTestsPassed} check(s) passed`
            : `${simulationTestsPassed} passed, ${simulationTestsFailed} concern(s)`,
        ]
      : undefined,
    col: verdictCol,
    row: verdictRow,
  });

  // Edges
  edges.push(
    { from: "mistral", to: "classify" },
    { from: "classify", to: "review" },
  );

  if (checkLines.length > 0) edges.push({ from: "review", to: "checks" });
  if (strengthLines.length > 0) edges.push({ from: "review", to: "strengths" });
  if (concernLines.length > 0) edges.push({ from: "review", to: "concerns" });

  if (branchNodes.length > 0) {
    for (const bn of branchNodes) {
      edges.push({ from: bn.id, to: "verdict" });
    }
  } else {
    edges.push({ from: "review", to: "verdict" });
  }

  return { nodes, edges };
}

function buildProcessingFlow(paymentTxHash: string | null): { nodes: FlowNode[]; edges: FlowEdge[] } {
  const paid = !!paymentTxHash;
  const off = paid ? 1 : 0;

  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  if (paid) {
    nodes.push(paymentNode(paymentTxHash!, 0, 0));
    edges.push({ from: "payment", to: "mistral" });
  }

  nodes.push(
    {
      id: "mistral",
      label: "Mistral AI",
      sublabel: "ministral-14b-2512",
      status: "success" as NodeStatus,
      icon: <MistralLogo />,
      col: 0 + off,
      row: 0,
    },
    {
      id: "classify",
      label: "Classify",
      status: "running" as NodeStatus,
      icon: <Search size={16} />,
      col: 1 + off,
      row: 0,
    },
    {
      id: "code-path",
      label: "Code Path",
      sublabel: "sandbox",
      status: "idle" as NodeStatus,
      icon: <Play size={16} />,
      col: 2 + off,
      row: 0,
    },
    {
      id: "theory-path",
      label: "Review Path",
      sublabel: "peer review",
      status: "idle" as NodeStatus,
      icon: <MessageSquare size={16} />,
      col: 2 + off,
      row: 1,
    },
  );

  edges.push(
    { from: "mistral", to: "classify" },
    { from: "classify", to: "code-path" },
    { from: "classify", to: "theory-path" },
  );

  return { nodes, edges };
}

// ============================================================================
// SVG Edge Rendering
// ============================================================================

function getStatusEdgeColor(fromNode: FlowNode, toNode: FlowNode): string {
  if (fromNode.status === "success" && toNode.status !== "idle") return "rgba(168, 85, 247, 0.5)";
  if (fromNode.status === "success") return "rgba(168, 85, 247, 0.25)";
  if (fromNode.status === "running") return "rgba(96, 165, 250, 0.3)";
  return "rgba(63, 63, 70, 0.5)";
}

function EdgePath({ from, to, nodes }: { from: string; to: string; nodes: FlowNode[] }) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const x1 = nodeX(fromNode.col) + NODE_W;
  const y1 = nodeY(fromNode.row) + NODE_H / 2;
  const x2 = nodeX(toNode.col);
  const y2 = nodeY(toNode.row) + NODE_H / 2;

  const isActive = fromNode.status === "success" && toNode.status !== "idle";
  const color = getStatusEdgeColor(fromNode, toNode);

  // If same row, straight horizontal with slight curve
  // If different row, bezier curve
  let d: string;
  if (fromNode.row === toNode.row) {
    const mx = (x1 + x2) / 2;
    d = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
  } else if (fromNode.col === toNode.col) {
    // Vertical — same column, e.g. generate -> execute in code flow
    const vx1 = nodeX(fromNode.col) + NODE_W / 2;
    const vy1 = nodeY(fromNode.row) + NODE_H;
    const vx2 = nodeX(toNode.col) + NODE_W / 2;
    const vy2 = nodeY(toNode.row);
    const my = (vy1 + vy2) / 2;
    d = `M ${vx1} ${vy1} C ${vx1} ${my}, ${vx2} ${my}, ${vx2} ${vy2}`;
  } else if (toNode.col < fromNode.col) {
    // Going backward (e.g. execute -> verdict in code flow, row below going left)
    const vx1 = nodeX(fromNode.col) + NODE_W / 2;
    const vy1 = nodeY(fromNode.row) + NODE_H;

    // For backward: exit from left side of from, enter right side of to
    // Actually let's exit from bottom of from if going to same row backward
    // or left side if same row
    const leftX1 = nodeX(fromNode.col);
    const leftY1 = nodeY(fromNode.row) + NODE_H / 2;
    const rightX2 = nodeX(toNode.col) + NODE_W;
    const rightY2 = nodeY(toNode.row) + NODE_H / 2;

    if (fromNode.row === toNode.row) {
      // Same row, going left
      const mx = (leftX1 + rightX2) / 2;
      d = `M ${leftX1} ${leftY1} C ${mx} ${leftY1}, ${mx} ${rightY2}, ${rightX2} ${rightY2}`;
    } else {
      // Different row going left — go down from bottom then curve left
      const bottomX1 = nodeX(fromNode.col) + NODE_W / 2;
      const bottomY1 = nodeY(fromNode.row) + NODE_H;
      const topX2 = nodeX(toNode.col) + NODE_W / 2;
      const topY2 = nodeY(toNode.row);
      const cpOffset = Math.abs(bottomY1 - topY2) * 0.5;
      d = `M ${bottomX1} ${bottomY1} C ${bottomX1} ${bottomY1 + cpOffset}, ${topX2} ${topY2 - cpOffset}, ${topX2} ${topY2}`;
    }
  } else {
    // Different row, going forward — curve
    const cpX = COL_GAP * 0.6;
    d = `M ${x1} ${y1} C ${x1 + cpX} ${y1}, ${x2 - cpX} ${y2}, ${x2} ${y2}`;
  }

  return (
    <g>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
      {isActive && (
        <circle r={3} fill="rgba(168, 85, 247, 0.8)">
          <animateMotion dur="1.5s" repeatCount="indefinite" path={d} />
        </circle>
      )}
      {/* Arrow head at end */}
      <ArrowHead d={d} color={color} />
    </g>
  );
}

function ArrowHead({ d, color }: { d: string; color: string }) {
  // Place a small triangle at the end of the path
  // We use a marker-less approach: get the last point and draw a small triangle
  // For simplicity, parse the end point from the path
  const match = d.match(/,\s*([\d.]+)\s+([\d.]+)$/);
  if (!match) return null;

  const ex = parseFloat(match[1]);
  const ey = parseFloat(match[2]);

  // Determine direction from the control point before the end
  // Parse second-to-last control point
  const parts = d.split(/[,\s]+/).filter(Boolean);
  const nums = parts.filter((p) => !isNaN(parseFloat(p))).map(parseFloat);
  const cpx = nums[nums.length - 4] || ex - 10;
  const cpy = nums[nums.length - 3] || ey;

  const angle = Math.atan2(ey - cpy, ex - cpx);
  const size = 5;

  const p1x = ex - size * Math.cos(angle - 0.4);
  const p1y = ey - size * Math.sin(angle - 0.4);
  const p2x = ex - size * Math.cos(angle + 0.4);
  const p2y = ey - size * Math.sin(angle + 0.4);

  return <polygon points={`${ex},${ey} ${p1x},${p1y} ${p2x},${p2y}`} fill={color} />;
}

// ============================================================================
// Node Card Component
// ============================================================================

function getStatusStyles(status: NodeStatus) {
  switch (status) {
    case "running":
      return {
        border: "border-blue-500/40",
        bg: "bg-blue-500/[0.06]",
        iconColor: "text-blue-400",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
        labelColor: "text-zinc-200",
      };
    case "success":
      return {
        border: "border-emerald-500/30",
        bg: "bg-emerald-500/[0.04]",
        iconColor: "text-emerald-400",
        glow: "",
        labelColor: "text-zinc-200",
      };
    case "error":
      return {
        border: "border-rose-500/30",
        bg: "bg-rose-500/[0.04]",
        iconColor: "text-rose-400",
        glow: "",
        labelColor: "text-zinc-200",
      };
    case "warning":
      return {
        border: "border-amber-500/30",
        bg: "bg-amber-500/[0.04]",
        iconColor: "text-amber-400",
        glow: "",
        labelColor: "text-zinc-200",
      };
    default:
      return {
        border: "border-zinc-800",
        bg: "bg-zinc-900/40",
        iconColor: "text-zinc-600",
        glow: "",
        labelColor: "text-zinc-500",
      };
  }
}

function NodeCard({
  node,
  isExpanded,
  onToggle,
  showScript,
  onToggleScript,
  onViewDetails,
}: {
  node: FlowNode;
  isExpanded: boolean;
  onToggle: () => void;
  showScript: boolean;
  onToggleScript: () => void;
  onViewDetails: () => void;
}) {
  const s = getStatusStyles(node.status);
  const hasContent = (node.content && node.content.length > 0) || node.expandable;

  return (
    <div
      data-flow-node
      className="absolute transition-all duration-300"
      style={{
        left: nodeX(node.col),
        top: nodeY(node.row),
        width: NODE_W,
        zIndex: isExpanded ? 20 : 1,
      }}
    >
      {/* Main card */}
      <div
        className={`rounded-lg border ${s.border} ${s.bg} ${s.glow} overflow-visible transition-all duration-200`}
        style={{ minHeight: NODE_H }}
      >
        <button
          onClick={hasContent ? onToggle : undefined}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left ${hasContent ? "cursor-pointer" : "cursor-default"} transition-colors`}
          style={{ height: NODE_H }}
        >
          <span className={`${s.iconColor} shrink-0`}>
            {node.status === "running" ? <Loader2 size={16} className="animate-spin" /> : node.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className={`text-xs font-semibold ${s.labelColor} truncate leading-tight`}>{node.label}</div>
            {node.sublabel && (
              node.link ? (
                <a
                  href={node.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-[10px] text-purple-400 hover:text-purple-300 font-mono truncate leading-tight mt-0.5 transition-colors"
                >
                  {node.sublabel}
                  <ExternalLink size={8} className="shrink-0" />
                </a>
              ) : (
                <div className="text-[10px] text-zinc-500 font-mono truncate leading-tight mt-0.5">{node.sublabel}</div>
              )
            )}
          </div>
          {hasContent && (
            <span className="text-zinc-600 shrink-0">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </span>
          )}
        </button>

        {/* Expanded panel — drops below the card */}
        {isExpanded && hasContent && (
          <div className="border-t border-zinc-800/50 bg-zinc-950/90 backdrop-blur-sm rounded-b-lg px-3 py-2 max-h-[200px] overflow-y-auto">
            {node.content?.map((line, i) => {
              let c = "text-zinc-400";
              if (line.includes("[PASS]")) c = "text-emerald-400";
              else if (line.includes("[FAIL]")) c = "text-rose-400";
              else if (line.includes("[SETUP]") || line.includes("[TEST]")) c = "text-blue-300";
              else if (line.includes("TESTS:")) c = "text-amber-300 font-semibold";
              return (
                <div key={i} className={`text-[10px] font-mono ${c} py-0.5 leading-relaxed`}>
                  {line}
                </div>
              );
            })}

            {node.expandable && node.expandedContent && (
              <div className="mt-1.5 pt-1.5 border-t border-zinc-800/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleScript();
                  }}
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  <Eye size={10} />
                  {showScript ? "Hide source" : "View source"}
                </button>
                {showScript && (
                  <pre className="mt-1.5 text-[9px] font-mono text-purple-300/70 whitespace-pre-wrap leading-relaxed bg-zinc-950 border border-zinc-800 rounded p-2 max-h-[140px] overflow-y-auto">
                    {node.expandedContent}
                  </pre>
                )}
              </div>
            )}

            {/* View full details button */}
            {hasContent && (
              <div className="mt-2 pt-2 border-t border-zinc-800/50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails();
                  }}
                  className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
                >
                  <Maximize2 size={10} />
                  View full details
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status indicator dot */}
      <div
        className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-zinc-950 ${
          node.status === "success"
            ? "bg-emerald-400"
            : node.status === "error"
            ? "bg-rose-400"
            : node.status === "warning"
            ? "bg-amber-400"
            : node.status === "running"
            ? "bg-blue-400 animate-pulse"
            : "bg-zinc-700"
        }`}
      />
    </div>
  );
}

// ============================================================================
// Node Detail Modal
// ============================================================================

function NodeDetailModal({
  node,
  onClose,
}: {
  node: FlowNode;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const s = getStatusStyles(node.status);

  const handleCopy = async () => {
    const text = [
      `=== ${node.label} ===`,
      `Status: ${node.status}`,
      ``,
      ...(node.content || []),
      ``,
      ...(node.expandedContent ? [`--- Source Code ---`, node.expandedContent] : []),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center gap-3 px-5 py-4 border-b border-zinc-800 ${s.bg}`}>
          <span className={`${s.iconColor}`}>{node.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${s.labelColor}`}>{node.label}</h3>
            {node.sublabel && (
              node.link ? (
                <a
                  href={node.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-[10px] text-purple-400 hover:text-purple-300 font-mono mt-0.5 transition-colors"
                >
                  {node.sublabel}
                  <ExternalLink size={8} className="shrink-0" />
                </a>
              ) : (
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{node.sublabel}</p>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-700/60 px-2 py-1 rounded transition-colors"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Status</span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                node.status === "success"
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                  : node.status === "error"
                  ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20"
                  : node.status === "warning"
                  ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20"
                  : node.status === "running"
                  ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20"
                  : "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/20"
              }`}
            >
              {node.status}
            </span>
          </div>

          {node.content && node.content.length > 0 && (
            <div className="mb-4">
              <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Output</h4>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 space-y-1">
                {node.content.map((line, i) => {
                  let c = "text-zinc-400";
                  if (line.includes("[PASS]")) c = "text-emerald-400";
                  else if (line.includes("[FAIL]")) c = "text-rose-400";
                  else if (line.includes("[SETUP]") || line.includes("[TEST]")) c = "text-blue-300";
                  else if (line.includes("TESTS:")) c = "text-amber-300 font-semibold";
                  else if (line.includes("Detected:") || line.includes("Route:")) c = "text-purple-300";
                  return (
                    <div key={i} className={`text-xs font-mono ${c} leading-relaxed`}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {node.expandedContent && (
            <div>
              <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Generated Source</h4>
              <pre className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-xs font-mono text-purple-300/80 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {node.expandedContent}
              </pre>
            </div>
          )}

          {(!node.content || node.content.length === 0) && !node.expandedContent && (
            <div className="text-center py-8 text-zinc-500 text-sm">No detailed output available</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main SimulationFlow Component
// ============================================================================

export function SimulationFlow(props: SimulationFlowProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [detailNode, setDetailNode] = useState<FlowNode | null>(null);

  // Pan state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOrigin = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { simulationType, simulationStatus, simulationVerdict } = props;

  const { nodes, edges } = useMemo(() => {
    if (simulationType === "code") return buildCodeFlow(props);
    if (simulationType === "theoretical") return buildTheoreticalFlow(props);
    // Still classifying — show branching preview
    return buildProcessingFlow(props.paymentTxHash);
  }, [
    simulationType,
    simulationStatus,
    props.simulationLogs,
    simulationVerdict,
    props.simulationTestsPassed,
    props.simulationTestsFailed,
    props.simulationError,
    props.generatedScript,
    props.paymentTxHash,
  ]);

  // Calculate canvas dimensions from node positions
  const maxCol = Math.max(...nodes.map((n) => n.col));
  const maxRow = Math.max(...nodes.map((n) => n.row));
  const canvasW = nodeX(maxCol) + NODE_W + PAD_X;
  const canvasH = nodeY(maxRow) + NODE_H + PAD_Y + 8;

  // --- Pan handlers ---
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only pan on background (not on node cards)
      const target = e.target as HTMLElement;
      if (target.closest("[data-flow-node]")) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOrigin.current = { x: pan.x, y: pan.y };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    isPanning.current = false;
    containerRef.current?.releasePointerCapture(e.pointerId);
  }, []);

  // Reset pan
  const resetPan = useCallback(() => setPan({ x: 0, y: 0 }), []);

  return (
    <div className="flex flex-col space-y-3">
      {/* E2B container */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/80">
        {/* Container header */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900/60 border-b border-zinc-800">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center">
            <Cpu size={10} className="text-white" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">E2B Sandbox</span>
          {simulationStatus === "processing" && (
            <Loader2 size={10} className="animate-spin text-blue-400 ml-auto" />
          )}
          {simulationVerdict && simulationStatus !== "processing" && (
            <span
              className={`ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                simulationVerdict === "SUCCESS"
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                  : simulationVerdict === "FAILURE"
                  ? "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20"
                  : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20"
              }`}
            >
              {simulationVerdict}
            </span>
          )}
          {/* Reset pan button — only show when panned */}
          {(pan.x !== 0 || pan.y !== 0) && (
            <button
              onClick={resetPan}
              className="ml-2 text-[9px] text-zinc-500 hover:text-zinc-300 bg-zinc-800/60 hover:bg-zinc-700/60 px-1.5 py-0.5 rounded transition-colors"
              title="Reset view"
            >
              Reset
            </button>
          )}
        </div>

        {/* Pannable flow canvas */}
        <div
          ref={containerRef}
          className="overflow-hidden relative select-none"
          style={{
            height: Math.max(canvasH + 16, 180),
            cursor: isPanning.current ? "grabbing" : "grab",
            /* Dot grid background like n8n */
            backgroundImage:
              "radial-gradient(circle, rgba(113,113,122,0.15) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            backgroundPosition: `${pan.x % 20}px ${pan.y % 20}px`,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div
            className="relative"
            style={{
              width: canvasW,
              height: canvasH,
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              willChange: "transform",
            }}
          >
            {/* SVG layer for edges */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={canvasW}
              height={canvasH}
              style={{ overflow: "visible" }}
            >
              {edges.map((edge) => (
                <EdgePath key={`${edge.from}-${edge.to}`} from={edge.from} to={edge.to} nodes={nodes} />
              ))}
            </svg>

            {/* Node cards */}
            {nodes.map((node) => (
              <NodeCard
                key={node.id}
                node={node}
                isExpanded={expandedNode === node.id}
                onToggle={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
                showScript={showScript}
                onToggleScript={() => setShowScript(!showScript)}
                onViewDetails={() => setDetailNode(node)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Node Detail Modal */}
      {detailNode && (
        <NodeDetailModal
          node={detailNode}
          onClose={() => setDetailNode(null)}
        />
      )}
    </div>
  );
}
