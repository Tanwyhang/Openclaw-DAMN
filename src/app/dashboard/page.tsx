"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PixelSphere from "@/components/PixelSphere";
import { ChatInterface } from "@/components/ChatInterface";
import { AgentActivity } from "@/components/AgentActivity";
import { PlatformActivity } from "@/components/PlatformActivity";
import { KnowledgeModal } from "@/components/KnowledgePanel";
import { AddKnowledgeModal } from "@/components/AddKnowledgeModal";
import { getKnowledgeById } from "@/data/knowledge";

export default function Dashboard() {
  // Step 1: which dot is focused on the sphere (rotate + zoom + dim)
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState<string | null>(null);
  // Step 2: which knowledge is open in the modal (triggered by inspect button)
  const [modalKnowledgeId, setModalKnowledgeId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 selection:bg-primary selection:text-black flex flex-col">
      {/* Nav buttons top right */}
      <div className="absolute top-4 right-4 z-20 flex gap-3">
        <Link href="/dashboard">
          <Button className="bg-primary text-black hover:bg-black hover:text-primary border-2 border-primary font-bold px-4 py-2 text-xs tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            Dashboard
          </Button>
        </Link>
        <Link href="/register">
          <Button className="bg-primary text-black hover:bg-black hover:text-primary border-2 border-primary font-bold px-4 py-2 text-xs tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            Register
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="border-2 border-primary text-primary hover:bg-primary hover:text-black font-bold uppercase px-4 py-2 text-xs tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            Sign Out
          </Button>
        </Link>
      </div>
      {/* HEADER */}
      <header className="flex justify-between items-end border-b-4 border-primary pb-4 mb-6">
        <div>
          <Link href="/">
            <h1 className="text-4xl font-bold tracking-widest text-primary hover:text-white transition-colors cursor-pointer [font-family:var(--font-press-start)]">
              RELAY
            </h1>
          </Link>
          <div className="flex gap-4 mt-2 font-bold text-sm tracking-widest">
            <span className="text-primary border-b-2 border-primary border-solid">Dashboard</span>
            <Link href="/register" className="text-white/70 hover:text-primary transition-colors cursor-pointer">
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN GRID - Full height, side by side */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
        
        {/* LEFT: RELAY CARD */}
        <Card className="bg-card border-4 border-[#ff3b00] shimmer-border shimmer-border-orange flex flex-col relative overflow-hidden group">
          <CardHeader className="bg-primary text-black p-4 border-b-4 border-primary flex flex-row justify-between items-center h-16 z-10 relative shadow-[0_4px_12px_rgba(255,59,0,0.3)]">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl font-black tracking-widest uppercase [font-family:var(--font-press-start)] mt-1">
                RELAY
              </CardTitle>
              <button
                className="flex items-center gap-1.5 px-2.5 h-7 bg-black text-primary hover:bg-white hover:text-black transition-colors rounded shadow-[0_0_10px_rgba(0,0,0,0.3)] text-[8px] font-bold uppercase tracking-wider border-2 border-primary hover:border-white [font-family:var(--font-press-start)] mt-1"
                title="Add Knowledge Index"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={10} strokeWidth={4} className="mb-[1px]" />
                INDEX
              </button>
            </div>
            {selectedKnowledgeId && (
              <span className="text-[10px] font-mono text-black/60 uppercase tracking-wider">
                {selectedKnowledgeId}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0 flex flex-col flex-grow relative">
            {/* MAIN SPOTLIGHT CONTENT */}
            <div className="flex-1 p-6 z-10 relative flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
               <div className="flex-1 flex items-center justify-center">
                 <PixelSphere
                   size={400}
                   selectedKnowledgeId={selectedKnowledgeId}
                   onDotClick={handleSelect}
                   onDeselect={handleDeselect}
                   onInspect={handleInspect}
                 />
               </div>
               
               <div className="w-full bg-black/80 border-2 border-primary p-3 rounded-md shadow-[0_0_20px_rgba(255,59,0,0.2)]">
                 <div className="grid grid-cols-5 gap-2 items-center">
                   <div className="text-center border-r border-white/10 pr-2">
                     <span className="text-primary font-mono text-lg font-black">1,402</span>
                     <p className="text-white/70 text-[8px] uppercase tracking-widest mt-0.5">indexed</p>
                   </div>
                   <div className="text-center border-r border-white/10 pr-2">
                     <span className="text-emerald-500 font-mono text-lg font-black">12</span>
                     <p className="text-white/70 text-[8px] uppercase tracking-widest mt-0.5">agents</p>
                   </div>
                   <div className="text-center border-r border-white/10 pr-2">
                     <span className="text-amber-500 font-mono text-lg font-black">245</span>
                     <p className="text-white/70 text-[8px] uppercase tracking-widest mt-0.5">gated</p>
                   </div>
                   <div className="text-center border-r border-white/10 pr-2">
                     <span className="text-blue-400 font-mono text-lg font-black">89</span>
                     <p className="text-white/70 text-[8px] uppercase tracking-widest mt-0.5">verified</p>
                   </div>
                   <div className="text-center">
                     <span className="text-emerald-400 font-mono text-lg font-black">3.2k</span>
                     <p className="text-white/70 text-[8px] uppercase tracking-widest mt-0.5">x402 vol</p>
                   </div>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* RIGHT: AGENT CARD */}
        <Card className="bg-card border-4 border-[#fbbf24] shimmer-border shimmer-border-gold flex flex-col overflow-hidden">
          <CardHeader className="bg-[#fbbf24] text-black p-4 border-b-4 border-[#fbbf24] h-16 z-10 relative">
            <CardTitle className="text-xl font-black tracking-widest uppercase [font-family:var(--font-press-start)]">
              AGENT
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex flex-col flex-grow min-h-0">
            {/* AGENT INTERFACE - Top section */}
            <div className="flex-1 min-h-0 border-b border-white/10">
              <ChatInterface />
            </div>

            {/* LOGS - Bottom section, 2 columns */}
            <div className="h-[200px] grid grid-cols-2 gap-3 p-3 bg-black/40">
              <AgentActivity />
              <PlatformActivity onLogClick={handleSelect} />
            </div>
          </CardContent>
        </Card>
        
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
