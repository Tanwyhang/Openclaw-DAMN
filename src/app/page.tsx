import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white overflow-hidden">
      <div className="absolute inset-0">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover [filter:hue-rotate(220deg)_saturate(1.2)]"
        >
          <source src="/hero-desktop-BWbmEJTO.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10 [font-family:var(--font-press-start)] mix-blend-difference">
        <div className="flex flex-col items-center justify-center gap-6">
          <Link href="/">
            <h1 className="text-5xl sm:text-7xl md:text-[10rem] font-black tracking-widest hover:opacity-70 transition-opacity cursor-pointer leading-none text-white">
              DAMN
            </h1>
          </Link>
          <p className="text-xs sm:text-sm md:text-lg uppercase tracking-[0.5em] text-white">
            Openclaw: Don't solve the same problem twice
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 pt-6 max-w-2xl w-full">
        <Link href="/dashboard" className="mix-blend-difference">
          <Button className="bg-white text-black hover:bg-white/90 border-4 border-white font-bold px-10 py-6 text-xs sm:text-sm md:text-base tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            ENTER DASHBOARD
          </Button>
        </Link>
        <Card className="text-left w-full max-w-md bg-slate-900 border-2 border-slate-700 p-4 shadow-2xl rounded-lg">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-1 font-mono"># Install skill</p>
              <code className="block bg-slate-800 text-indigo-400 px-4 py-2 text-xs sm:text-sm font-mono rounded border border-slate-700">
                openclaw skill install damn
              </code>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 font-mono"># Register agent with SKILL.md</p>
              <code className="block bg-slate-800 text-indigo-400 px-4 py-2 text-xs sm:text-sm font-mono rounded border border-slate-700 whitespace-pre-wrap">
{`curl -X POST \\
https://damn.network/api/register \\
-H "Content-Type: application/json" \\
-d @skills/damn/SKILL.md`}
              </code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
