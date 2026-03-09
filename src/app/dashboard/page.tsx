"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PixelSphere from "@/components/PixelSphere";
import { AgentWorkflow } from "@/components/AgentWorkflow";
import { AgentActivity } from "@/components/AgentActivity";
import { KnowledgeModal } from "@/components/KnowledgePanel";
import { AddKnowledgeModal } from "@/components/AddKnowledgeModal";
import { getKnowledgeById, KNOWLEDGE_DATA, type Knowledge } from "@/data/knowledge";
import { PixelGhost, type GhostState } from "@/components/PixelGhost";
import { E2BSandboxModal } from "@/components/E2BSandboxModal";

type WorkflowStep = "index" | "store" | "simulate" | "apply";

export default function Dashboard() {
  // Step 1: which dot is focused on the sphere (rotate + zoom + dim)
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);
  // Step 2: which knowledge is open in the modal (triggered by inspect button)
  const [modalKnowledgeId, setModalKnowledgeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Workflow state for ghost animation
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("index");
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
  const [ghostKnowledge, setGhostKnowledge] = useState<Knowledge | null>(null);
  const [showGhostBubble, setShowGhostBubble] = useState(false);
  
  // Refs for positioning
  const sphereRef = useRef<HTMLDivElement>(null);
  const agentPanelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const modalKnowledge = modalKnowledgeId
    ? getKnowledgeById(modalKnowledgeId) ?? null
    : null;

  const handleSelect = useCallback((knowledgeId: string) => {
    setSelectedKnowledgeId(knowledgeId);
  }, []);

  const handleDeselect = useCallback(() => {
    setSelectedKnowledgeId(null);
  }, []);

  const handleInspect = useCallback((knowledgeId: string) => {
    setModalKnowledgeId(knowledgeId);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalKnowledgeId(null);
  }, []);

  // Handle workflow step changes from AgentWorkflow
  const handleStepChange = useCallback((step: WorkflowStep) => {
    setCurrentStep(step);
    
    if (step === "index") {
      // Pick a random knowledge item when entering indexing step
      const randomIndex = Math.floor(Math.random() * KNOWLEDGE_DATA.length);
      const randomKnowledge = KNOWLEDGE_DATA[randomIndex];
      setGhostKnowledge(randomKnowledge);
      setSelectedKnowledgeId(randomKnowledge.id);
      
      // Show bubble after ghost arrives at sphere (delay matches transition)
      setTimeout(() => {
        setShowGhostBubble(true);
      }, 1500);
    } else {
      // Clear selection and bubble when leaving indexing
      setShowGhostBubble(false);
      setSelectedKnowledgeId(null);
      // Keep ghostKnowledge for other states (storing, simulating, applying)
    }
  }, []);

  // Get ghost color based on current step
  const getGhostColor = () => {
    switch (currentStep) {
      case "index": return "#3b82f6"; // blue
      case "store": return "#8b5cf6"; // purple
      case "simulate": return "#f97316"; // orange
      case "apply": return "#10b981"; // emerald
      default: return "#3b82f6";
    }
  };

  // Get ghost state for animation
  const getGhostState = (): GhostState => {
    switch (currentStep) {
      case "index": return "indexing";
      case "store": return "storing";
      case "simulate": return "simulating";
      case "apply": return "applying";
      default: return "idle";
    }
  };

  // Calculate ghost position based on current step
  useEffect(() => {
    const updateGhostPosition = () => {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      
      if (currentStep === "index" && sphereRef.current) {
        // Fly to sphere (left panel center)
        const sphereRect = sphereRef.current.getBoundingClientRect();
        setGhostPosition({
          x: sphereRect.left - containerRect.left + sphereRect.width / 2 - 30,
          y: sphereRect.top - containerRect.top + sphereRect.height / 2 - 40,
        });
      } else if (agentPanelRef.current) {
        // Return to agent panel (right side)
        const agentRect = agentPanelRef.current.getBoundingClientRect();
        setGhostPosition({
          x: agentRect.left - containerRect.left + agentRect.width / 2 - 30,
          y: agentRect.top - containerRect.top + 120,
        });
      }
    };

    updateGhostPosition();
    window.addEventListener("resize", updateGhostPosition);
    return () => window.removeEventListener("resize", updateGhostPosition);
  }, [currentStep]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground p-4 selection:bg-primary selection:text-black flex flex-col relative">
      {/* Floating Ghost - moves between panels */}
      <PixelGhost
        color={getGhostColor()}
        state={getGhostState()}
        knowledge={ghostKnowledge}
        showBubble={showGhostBubble}
        style={{
          left: ghostPosition.x,
          top: ghostPosition.y,
        }}
      />
      
      {/* E2B Sandbox Modal - appears beside ghost during simulation */}
      <E2BSandboxModal
        isOpen={currentStep === "simulate"}
        knowledge={ghostKnowledge}
        style={{
          left: ghostPosition.x + 80,
          top: ghostPosition.y - 80,
        }}
      />
      
      {/* Nav buttons top right */}
      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <Link href="/dashboard">
          <Button className="bg-primary text-white hover:bg-primary/90 border-2 border-primary font-bold px-4 py-2 text-xs tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            Dashboard
          </Button>
        </Link>
        <Link href="/register">
          <Button className="bg-primary text-white hover:bg-primary/90 border-2 border-primary font-bold px-4 py-2 text-xs tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            Register
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold uppercase px-4 py-2 text-xs tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            Sign Out
          </Button>
        </Link>
      </div>
      {/* HEADER */}
      <header className="flex justify-between items-end border-b-4 border-primary pb-4 mb-6">
        <div>
          <Link href="/">
            <h1 className="text-4xl font-bold tracking-widest text-primary hover:text-foreground transition-colors cursor-pointer [font-family:var(--font-press-start)]">
              DAMN
            </h1>
          </Link>
          <p className="text-sm text-muted-foreground mt-1 tracking-wide">Decentralized Agent Memory Network</p>
        </div>
      </header>

      {/* MAIN CONTAINER - Combined card with drop shadow */}
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex flex-col xl:flex-row overflow-hidden">
        
        {/* LEFT: DAMN Section */}
        <div className="flex-1 min-h-0 flex flex-col xl:border-r border-b xl:border-b-0 border-border/50">
          {/* Header - fixed height, won't shrink */}
          <div className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/90 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black tracking-widest uppercase [font-family:var(--font-press-start)]">
                DAMN
              </h2>
              <button
                className="flex items-center gap-1.5 px-2.5 h-7 bg-white/20 hover:bg-white hover:text-primary transition-colors rounded text-[8px] font-bold uppercase tracking-wider [font-family:var(--font-press-start)]"
                title="Add Knowledge Index"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={10} strokeWidth={4} />
                INDEX
              </button>
            </div>
            {selectedKnowledgeId && (
              <span className="text-[10px] font-mono text-white/70 uppercase tracking-wider">
                {selectedKnowledgeId}
              </span>
            )}
          </div>
          
          {/* Content - scrollable */}
          <div className="flex-1 min-h-0 p-6 flex flex-col items-center justify-center bg-white overflow-auto">
            <div ref={sphereRef} className="flex-1 flex items-center justify-center">
              <PixelSphere
                size={400}
                selectedKnowledgeId={selectedKnowledgeId}
                onDotClick={handleSelect}
                onDeselect={handleDeselect}
                onInspect={handleInspect}
              />
            </div>
            
            {/* Stats bar */}
            <div className="flex-shrink-0 w-full bg-muted/50 p-3 rounded-xl mt-4">
              <div className="grid grid-cols-5 gap-2 items-center">
                <div className="text-center border-r border-border/30 pr-2">
                  <span className="text-primary font-mono text-lg font-black">1,402</span>
                  <p className="text-muted-foreground text-[8px] uppercase tracking-widest mt-0.5 font-bold">indexed</p>
                </div>
                <div className="text-center border-r border-border/30 pr-2">
                  <span className="text-emerald-600 font-mono text-lg font-black">12</span>
                  <p className="text-muted-foreground text-[8px] uppercase tracking-widest mt-0.5 font-bold">agents</p>
                </div>
                <div className="text-center border-r border-border/30 pr-2">
                  <span className="text-violet-600 font-mono text-lg font-black">245</span>
                  <p className="text-muted-foreground text-[8px] uppercase tracking-widest mt-0.5 font-bold">gated</p>
                </div>
                <div className="text-center border-r border-border/30 pr-2">
                  <span className="text-blue-600 font-mono text-lg font-black">89</span>
                  <p className="text-muted-foreground text-[8px] uppercase tracking-widest mt-0.5 font-bold">verified</p>
                </div>
                <div className="text-center">
                  <span className="text-emerald-600 font-mono text-lg font-black">3.2k</span>
                  <p className="text-muted-foreground text-[8px] uppercase tracking-widest mt-0.5 font-bold">x402 vol</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: AGENT Section */}
        <div ref={agentPanelRef} className="flex-1 min-h-0 flex flex-col">
          {/* Header - fixed height, won't shrink */}
          <div className="flex-shrink-0 bg-gradient-to-r from-violet-500 to-violet-500/90 text-white px-5 py-4">
            <h2 className="text-lg font-black tracking-widest uppercase [font-family:var(--font-press-start)]">
              AGENT
            </h2>
          </div>
          
          {/* Agent Workflow */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AgentWorkflow onStepChange={handleStepChange} />
          </div>
        </div>
        
      </div>

      {/* ACTIVITY CARD - Full width below main card */}
      <div className="flex-shrink-0 h-[160px] mt-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-4 overflow-hidden">
        <AgentActivity />
      </div>

      {/* Knowledge detail modal — triggered by inspect button */}
      <KnowledgeModal
        knowledge={modalKnowledge}
        onClose={handleCloseModal}
      />

      {/* Add Knowledge Modal */}
      {showAddModal && (
        <AddKnowledgeModal 
          onClose={() => setShowAddModal(false)} 
          onSave={(data) => {
            console.log("Saving knowledge:", data);
            // Typically send to API or store
            // For now, it just closes the modal (handled inside the modal)
          }} 
        />
      )}
    </div>
  );
}
