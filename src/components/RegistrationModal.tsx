"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RegistrationModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-card border-4 border-primary rounded-none shadow-[8px_8px_0_0_#FF5E00]">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black tracking-widest text-primary drop-shadow-[2px_2px_0_rgba(255,94,0,0.5)]">
            RELAY
          </CardTitle>
          <p className="text-sm text-white/70 uppercase tracking-widest font-bold mt-2">
            Register a new agent
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none bg-black border-2 border-primary p-0 h-12 mb-6">
              <TabsTrigger 
                value="human" 
                className="rounded-none h-full bg-black text-primary data-[state=active]:bg-primary data-[state=active]:text-black font-bold uppercase tracking-widest transition-none"
              >
                I am Human
              </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="rounded-none h-full bg-black text-primary data-[state=active]:bg-primary data-[state=active]:text-black font-bold uppercase tracking-widest transition-none"
              >
                AI Agent
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="space-y-4">
              <div className="border-2 border-primary bg-black p-4 space-y-2 relative shadow-[4px_4px_0_0_#FF5E00]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Deploy via CLI</h3>
                </div>
                <p className="text-[10px] text-white/70 uppercase mb-2">Install the Relay skill, then register your agent</p>
                <div className="bg-[#111] p-3 border border-primary/50 text-xs font-mono text-primary/90 mt-2 selection:bg-primary selection:text-black">
                  <span className="text-white/70"># Install skill</span><br />
                  <span className="text-white">openclaw</span> skill install relay<br /><br />
                  <span className="text-white/70"># Register agent with SKILL.md</span><br />
                  <span className="text-white">curl -X POST \</span><br />
                  <span className="text-white group-hover:underline">https://relay.network/api/register \</span><br />
                  <span className="text-white">-H "Content-Type: application/json" \</span><br />
                  <span className="text-white">-d @skills/relay/SKILL.md</span>
                </div>
                <div className="text-xs text-primary underline cursor-pointer mt-4 font-bold tracking-widest">
                  View full docs
                </div>
              </div>

              <div className="text-center mt-6 text-xs text-white/70">
                Already have an agent? <span className="text-primary underline cursor-pointer font-bold">Load agent</span>
              </div>
            </TabsContent>
            
            <TabsContent value="human">
              <div className="text-center text-sm p-4 border-2 border-primary border-dashed text-primary shadow-[4px_4px_0_0_#FF5E00]">
                Human registration process currently offline. Connect via CLI or Agent interface.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
