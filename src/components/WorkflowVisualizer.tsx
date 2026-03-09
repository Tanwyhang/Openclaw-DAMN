"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  ChevronRight,
  Loader2,
  Search,
  Upload,
  BookOpen,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  Target,
  Wrench,
  ThumbsUp,
} from "lucide-react";

type StepStatus = "pending" | "active" | "completed";

interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  status: StepStatus;
  triggerKnowledgeId?: string;
  triggerDeselect?: boolean;
}

interface WorkflowVisualizerProps {
  onTriggerFocus: (knowledgeId: string) => void;
  onDeselect: () => void;
}

const TARGET_KNOWLEDGE_ID = "K-597";

const AGENT1_STEPS: Omit<WorkflowStep, "status">[] = [
  {
    id: "a1-onboard",
    label: "Onboard",
    description: "Initializing agent...",
    icon: <Wifi size={14} strokeWidth={2.5} />,
  },
  {
    id: "a1-index",
    label: "Index Problem",
    description: "Parsing problem context...",
    icon: <Search size={14} strokeWidth={2.5} />,
  },
  {
    id: "a1-search",
    label: "Search KB",
    description: "Querying knowledge base...",
    icon: <BookOpen size={14} strokeWidth={2.5} />,
  },
  {
    id: "a1-notfound",
    label: "Not Found",
    description: "No existing solution found",
    icon: <AlertTriangle size={14} strokeWidth={2.5} />,
  },
  {
    id: "a1-solve",
    label: "Find Solution",
    description: "Generating solution...",
    icon: <ShieldCheck size={14} strokeWidth={2.5} />,
  },
  {
    id: "a1-upload",
    label: "Upload Index",
    description: `Indexing ${TARGET_KNOWLEDGE_ID}...`,
    icon: <Upload size={14} strokeWidth={2.5} />,
    triggerKnowledgeId: TARGET_KNOWLEDGE_ID,
  },
];

const AGENT2_STEPS: Omit<WorkflowStep, "status">[] = [
  {
    id: "a2-onboard",
    label: "Onboard",
    description: "Initializing reader...",
    icon: <Wifi size={14} strokeWidth={2.5} />,
    triggerDeselect: true,
  },
  {
    id: "a2-index",
    label: "Index",
    description: `Indexing ${TARGET_KNOWLEDGE_ID}...`,
    icon: <Search size={14} strokeWidth={2.5} />,
    triggerKnowledgeId: TARGET_KNOWLEDGE_ID,
  },
  {
    id: "a2-simulate",
    label: "Simulate",
    description: "Running sandbox simulation...",
    icon: <FlaskConical size={14} strokeWidth={2.5} />,
  },
  {
    id: "a2-satisfy",
    label: "Satisfy",
    description: "Checking expected outcome...",
    icon: <Target size={14} strokeWidth={2.5} />,
  },
  {
    id: "a2-solve",
    label: "Solve",
    description: "Confirming resolution...",
    icon: <Wrench size={14} strokeWidth={2.5} />,
  },
  {
    id: "a2-vote",
    label: "Vote",
    description: "Casting verification vote...",
    icon: <ThumbsUp size={14} strokeWidth={2.5} />,
  },
];

const STEP_DURATION = 1800;
const AGENT2_DELAY = 2000;
const RESTART_DELAY = 4000;

function StepBlock({
  step,
  isLast,
  accentColor,
}: {
  step: WorkflowStep;
  isLast: boolean;
  accentColor: string;
}) {
  const isActive = step.status === "active";
  const isCompleted = step.status === "completed";

  return (
    <>
      {/* Block — flex-1 so all blocks share width equally */}
      <div
        className="relative flex flex-col items-center justify-center flex-1 min-w-0 h-[48px] rounded-md border transition-all duration-500 ease-out"
        style={{
          borderColor: isActive
            ? accentColor
            : isCompleted
              ? `${accentColor}50`
              : "rgba(255,255,255,0.06)",
          backgroundColor: isActive
            ? `${accentColor}12`
            : isCompleted
              ? "rgba(255,255,255,0.03)"
              : "rgba(0,0,0,0.25)",
          boxShadow: isActive
            ? `0 0 20px ${accentColor}30, inset 0 0 16px ${accentColor}08`
            : "none",
        }}
      >
        <div
          className={`flex items-center justify-center transition-all duration-500 ${isActive ? "animate-pulse" : ""}`}
          style={{
            color: isActive
              ? accentColor
              : isCompleted
                ? accentColor
                : "rgba(255,255,255,0.2)",
          }}
        >
          {isCompleted ? (
            <Check size={14} strokeWidth={3} />
          ) : isActive ? (
            <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
          ) : (
            step.icon
          )}
        </div>

        <span
          className="text-[7px] font-bold uppercase tracking-widest mt-1 text-center leading-none transition-colors duration-500 truncate w-full px-1"
          style={{
            color: isActive
              ? accentColor
              : isCompleted
                ? "rgba(255,255,255,0.6)"
                : "rgba(255,255,255,0.18)",
          }}
        >
          {step.label}
        </span>
      </div>

      {/* Connector arrow */}
      {!isLast && (
        <ChevronRight
          size={10}
          strokeWidth={2}
          className="shrink-0 mx-px transition-colors duration-500"
          style={{
            color: isCompleted
              ? `${accentColor}60`
              : "rgba(255,255,255,0.08)",
          }}
        />
      )}
    </>
  );
}

function AgentRow({
  label,
  sublabel,
  steps,
  currentStep,
  totalSteps,
  accentColor,
  completedLabel,
  visible,
}: {
  label: string;
  sublabel: string;
  steps: WorkflowStep[];
  currentStep: number;
  totalSteps: number;
  accentColor: string;
  completedLabel: string;
  visible: boolean;
}) {
  const isRunning = currentStep >= 0 && currentStep < totalSteps;
  const isDone = currentStep >= totalSteps;

  // Find the active step for description display
  const activeStep = steps.find((s) => s.status === "active");

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-1.5 h-1.5 rounded-full transition-all duration-500"
          style={{
            backgroundColor: isDone
              ? "#22c55e"
              : isRunning
                ? accentColor
                : "rgba(255,255,255,0.15)",
            boxShadow: isRunning ? `0 0 8px ${accentColor}` : "none",
          }}
        />
        <span
          className="text-[9px] font-bold uppercase tracking-[0.15em]"
          style={{ color: accentColor }}
        >
          {label}
        </span>
        <span className="text-[8px] text-white/30 font-mono uppercase tracking-wider">
          {sublabel}
        </span>
        {isDone && (
          <span className="text-[8px] text-emerald-500 font-mono font-bold ml-auto tracking-wider">
            {completedLabel}
          </span>
        )}
      </div>

      {/* Step blocks — flex row, all blocks equal width */}
      <div className="flex items-center gap-0 w-full">
        {steps.map((step, i) => (
          <StepBlock
            key={step.id}
            step={step}
            isLast={i === steps.length - 1}
            accentColor={accentColor}
          />
        ))}
      </div>

      {/* Active step description — below the blocks, fixed height */}
      <div className="h-4 mt-1 flex items-center">
        {activeStep && (
          <span
            className="text-[7px] font-mono tracking-wide animate-pulse"
            style={{ color: `${accentColor}AA` }}
          >
            {activeStep.description}
          </span>
        )}
      </div>
    </div>
  );
}

export function WorkflowVisualizer({
  onTriggerFocus,
  onDeselect,
}: WorkflowVisualizerProps) {
  const [agent1Step, setAgent1Step] = useState(-1);
  const [agent2Step, setAgent2Step] = useState(-1);
  const [cycle, setCycle] = useState(0);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const t = setTimeout(fn, delay);
    timeoutsRef.current.push(t);
    return t;
  }, []);

  useEffect(() => {
    clearAllTimeouts();
    setAgent1Step(-1);
    setAgent2Step(-1);

    let elapsed = 800;

    // === Agent 1 ===
    for (let i = 0; i < AGENT1_STEPS.length; i++) {
      const stepDef = AGENT1_STEPS[i];
      const t = elapsed + i * STEP_DURATION;

      addTimeout(() => {
        setAgent1Step(i);
        if (stepDef.triggerKnowledgeId) {
          addTimeout(() => onTriggerFocus(stepDef.triggerKnowledgeId!), 400);
        }
        if (stepDef.triggerDeselect) onDeselect();
      }, t);
    }

    const agent1Done = elapsed + AGENT1_STEPS.length * STEP_DURATION;
    addTimeout(() => setAgent1Step(AGENT1_STEPS.length), agent1Done);

    // === Agent 2 ===
    const agent2Start = agent1Done + AGENT2_DELAY;
    addTimeout(() => onDeselect(), agent2Start - 600);

    for (let i = 0; i < AGENT2_STEPS.length; i++) {
      const stepDef = AGENT2_STEPS[i];
      const t = agent2Start + i * STEP_DURATION;

      addTimeout(() => {
        setAgent2Step(i);
        if (stepDef.triggerKnowledgeId) {
          addTimeout(() => onTriggerFocus(stepDef.triggerKnowledgeId!), 400);
        }
        if (stepDef.triggerDeselect) onDeselect();
      }, t);
    }

    const agent2Done = agent2Start + AGENT2_STEPS.length * STEP_DURATION;
    addTimeout(() => setAgent2Step(AGENT2_STEPS.length), agent2Done);
    addTimeout(() => onDeselect(), agent2Done + 800);
    addTimeout(() => setCycle((c) => c + 1), agent2Done + RESTART_DELAY);

    return clearAllTimeouts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle]);

  const agent1Steps: WorkflowStep[] = AGENT1_STEPS.map((s, i) => ({
    ...s,
    status:
      agent1Step > i ? "completed" : agent1Step === i ? "active" : "pending",
  }));

  const agent2Steps: WorkflowStep[] = AGENT2_STEPS.map((s, i) => ({
    ...s,
    status:
      agent2Step > i ? "completed" : agent2Step === i ? "active" : "pending",
  }));

  const agent1Visible = agent1Step >= 0;
  const agent2Visible = agent2Step >= 0;

  return (
    <div className="flex flex-col h-full px-4 pb-3 pt-3">

      {/* Agent 1 */}
      {agent1Visible && (
        <AgentRow
          label="Agent 1"
          sublabel="Writer / Indexer"
          steps={agent1Steps}
          currentStep={agent1Step}
          totalSteps={AGENT1_STEPS.length}
          accentColor="#6366f1"
          completedLabel="COMPLETE"
          visible={agent1Visible}
        />
      )}

      {/* Divider */}
      {agent1Visible && (
        <div className="border-t border-primary/10 my-1.5" />
      )}

      {/* Agent 2 — show full row or waiting placeholder */}
      {agent2Visible ? (
        <AgentRow
          label="Agent 2"
          sublabel="Reader / Validator"
          steps={agent2Steps}
          currentStep={agent2Step}
          totalSteps={AGENT2_STEPS.length}
          accentColor="#3b82f6"
          completedLabel="VOTED"
          visible={agent2Visible}
        />
      ) : agent1Visible ? (
        <div className="flex items-center gap-2 py-2 opacity-40">
          <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
          <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-blue-400/50">
            Agent 2
          </span>
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-wider">
            Reader / Validator
          </span>
          <span className="text-[7px] text-white/25 font-mono ml-auto animate-pulse">
            WAITING...
          </span>
        </div>
      ) : null}
    </div>
  );
}
