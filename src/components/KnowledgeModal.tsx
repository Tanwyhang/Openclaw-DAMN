"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function KnowledgeModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <Card className="w-full max-w-5xl bg-card border-4 border-primary rounded-none shadow-[10px_10px_0_0_#FF5E00] flex min-h-[600px]">
        {/* Left Side: Pixel Sphere Graphic */}
        <div className="w-1/3 border-r-4 border-primary bg-black flex flex-col items-center justify-center p-6 relative">
          <div className="text-primary opacity-20 absolute top-4 left-4 text-xs">RELAY</div>
          {/* Big ASCII Sphere Placeholder */}
          <div className="text-xs leading-[0.6rem] text-primary text-center font-mono opacity-80" aria-hidden>
<pre>
       .o88888888888888o.
     .88888888888888888888.
   .888888888888888888888888.
  o88888888888888888888888888o
 888888888888888888888888888888
 888888888888888888888888888888
 888888888888888888888888888888
 `8888888888888888888888888888'
  `88888888888888888888888888'
    `8888888888888888888888'
       `"88888888888888"'
</pre>
          </div>
        </div>

        {/* Right Side: Data and List */}
        <div className="w-2/3 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b-4 border-primary p-4 bg-[#1a1a1a]">
            <div className="flex items-center gap-4">
              <CardTitle className="text-xl font-bold tracking-widest text-white uppercase">
                Knowledge
              </CardTitle>
              <span className="text-xs bg-black text-primary border border-primary px-2 font-bold uppercase">Mixed</span>
            </div>
            <div className="text-primary hover:text-white cursor-pointer font-bold">[ X ]</div>
          </CardHeader>
          
          <CardContent className="p-6 flex-grow flex flex-col gap-6 overflow-y-auto">
            
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              <div className="border-4 border-primary bg-black p-4 text-center shadow-[4px_4px_0_0_#FF5E00] flex flex-col justify-center">
                <div className="text-4xl font-black text-primary">54</div>
                <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Total</div>
              </div>
              <div className="border-2 border-[#ffcc00] bg-black p-4 text-center flex flex-col justify-center">
                <div className="text-3xl font-bold text-[#ffcc00]">20</div>
                <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Pending</div>
              </div>
              <div className="border-2 border-[#00ff00] bg-black p-4 text-center flex flex-col justify-center">
                <div className="text-3xl font-bold text-[#00ff00]">31</div>
                <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Approved</div>
              </div>
              <div className="border-2 border-red-500 bg-black p-4 text-center flex flex-col justify-center">
                <div className="text-3xl font-bold text-red-500">3</div>
                <div className="text-xs text-white/70 uppercase tracking-widest mt-1">Rejected</div>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex justify-between items-center bg-black/50 p-2 border-2 border-primary">
              <div className="flex gap-2">
                <Button variant="outline" className="h-7 text-xs rounded-none border-primary text-black bg-primary">All</Button>
                <Button variant="outline" className="h-7 text-xs rounded-none border-primary bg-black text-primary hover:bg-primary hover:text-black">Pending</Button>
                <Button variant="outline" className="h-7 text-xs rounded-none border-primary bg-black text-primary hover:bg-primary hover:text-black">Approved</Button>
                <Button variant="outline" className="h-7 text-xs rounded-none border-primary bg-black text-primary hover:bg-primary hover:text-black">Rejected</Button>
              </div>
              <Button className="h-7 text-xs rounded-none bg-primary text-black font-bold border-2 border-primary hover:bg-white hover:text-black">
                + Submit Knowledge
              </Button>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
              {[
                "Analysis: Automated liquidity-rotation bots on Arbitrum in J...",
                "Case study: In December 2023, a syndicate marketed 'Helios H...",
                "Analysis: Fraud crews now exploit 'autonomous' Web3 warehous...",
                "In August 2023 I documented a hardware-wallet supply-chain a...",
                "Case study: In January 2024, the 'NovaBatch' AI render colle..."
              ].map((title, i) => (
               <div key={i} className="flex justify-between items-center border-b-2 border-primary/30 pb-3 hover:bg-primary/5 p-2">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-red-500 rounded-none shadow-[1px_1px_0_0_#fff]"></div>
                   <span className="text-sm">{title}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-[10px] text-[#ffcc00] border border-[#ffcc00] px-1 font-bold">PENDING</span>
                   <span className="text-xs text-white/70">1/0</span>
                   <div className="flex gap-1 ml-2">
                     <Button className="h-6 text-[10px] rounded-none bg-black border border-[#00ff00] text-[#00ff00] hover:bg-[#00ff00] hover:text-black uppercase font-bold px-2">Approve</Button>
                     <Button className="h-6 text-[10px] rounded-none bg-black border border-red-500 text-red-500 hover:bg-red-500 hover:text-black uppercase font-bold px-2">Reject</Button>
                   </div>
                 </div>
               </div>
              ))}
            </div>

          </CardContent>
        </div>
      </Card>
    </div>
  );
}
