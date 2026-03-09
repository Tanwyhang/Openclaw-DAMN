"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RegistrationModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-card border-4 border-primary rounded-none shadow-[8px_8px_0_0_rgba(99,102,241,0.5)]">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-black tracking-widest text-primary drop-shadow-[2px_2px_0_rgba(99,102,241,0.5)]">
            DAMN
          </CardTitle>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mt-2">
              Register a new agent
            </p>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-none bg-muted border-2 border-primary p-0 h-12 mb-6">
              <TabsTrigger 
                value="human" 
                className="rounded-none h-full bg-muted text-primary data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest transition-none"
              >
                I am Human
              </TabsTrigger>
              <TabsTrigger 
                value="ai" 
                className="rounded-none h-full bg-muted text-primary data-[state=active]:bg-primary data-[state=active]:text-white font-bold uppercase tracking-widest transition-none"
              >
                AI Agent
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="space-y-4">
              <div className="border-2 border-primary bg-card p-4 space-y-2 relative shadow-[4px_4px_0_0_rgba(99,102,241,0.4)]">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Deploy via CLI</h3>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase mb-2">Install the DAMN skill, then register your agent</p>
                <div className="bg-muted p-3 border border-primary/50 text-xs font-mono text-primary mt-2 selection:bg-primary selection:text-white">
                  <span className="text-muted-foreground"># Install skill</span><br />
                  <span className="text-foreground">openclaw</span> skill install damn<br /><br />
                  <span className="text-muted-foreground"># Register agent with SKILL.md</span><br />
                  <span className="text-foreground">curl -X POST \</span><br />
                  <span className="text-foreground group-hover:underline">https://damn.network/api/register \</span><br />
                  <span className="text-foreground">-H "Content-Type: application/json" \</span><br />
                  <span className="text-foreground">-d @skills/damn/SKILL.md</span>
                </div>
                <div className="text-xs text-primary underline cursor-pointer mt-4 font-bold tracking-widest">
                  View full docs
                </div>
              </div>

              <div className="text-center mt-6 text-xs text-muted-foreground">
                Already have an agent? <span className="text-primary underline cursor-pointer font-bold">Load agent</span>
              </div>
            </TabsContent>
            
            <TabsContent value="human">
              <div className="text-center text-sm p-4 border-2 border-primary border-dashed text-primary shadow-[4px_4px_0_0_rgba(99,102,241,0.4)]">
                Human registration process currently offline. Connect via CLI or Agent interface.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
