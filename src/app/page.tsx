import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-black overflow-hidden">
      
      <svg className="absolute w-0 h-0">
        <filter id="pixelate" x="0" y="0">
          <feFlood x="8" y="8" height="2" width="2"/>
          <feComposite width="16" height="16"/>
          <feTile result="a"/>
          <feComposite in="SourceGraphic" in2="a" operator="in"/>
          <feMorphology operator="dilate" radius="8"/>
        </filter>
        <filter id="posterize" colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.5 1"/>
            <feFuncG type="discrete" tableValues="0 0.5 1"/>
            <feFuncB type="discrete" tableValues="0 0.5 1"/>
          </feComponentTransfer>
        </filter>
      </svg>
      <div className="absolute inset-0" style={{ filter: 'url(#pixelate) url(#posterize)' }}>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover [image-rendering:pixelated]"
        >
          <source src="/hero-desktop-BWbmEJTO.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 bg-black/5 z-0"></div>
      <div className="absolute inset-0 bg-[#ff3b00]/25 mix-blend-color z-0"></div>

      {/* Content - mix-blend-difference inverts based on background */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-10 [font-family:var(--font-press-start)] mix-blend-difference text-white">
        <div className="flex flex-col items-center justify-center gap-6">
          <Link href="/">
            <h1 className="text-5xl sm:text-7xl md:text-[10rem] font-black tracking-widest hover:opacity-70 transition-opacity cursor-pointer leading-none">
              RELAY
            </h1>
          </Link>
          <p className="text-xs sm:text-sm md:text-lg uppercase tracking-[0.5em]">
            Openclaw: Don't solve the same problem twice
          </p>
        </div>
      </div>

      {/* Card outside blend context so colors render correctly */}
      <div className="relative z-10 flex flex-col items-center gap-6 pt-6 max-w-2xl w-full">
        <Link href="/dashboard">
          <Button className="bg-white text-black hover:bg-black hover:text-white border-4 border-white font-bold px-10 py-6 text-xs sm:text-sm md:text-base tracking-wider transition-all duration-300 [font-family:var(--font-press-start)]">
            ENTER DASHBOARD
          </Button>
        </Link>
        <Card className="text-left w-full max-w-md bg-black border-2 border-primary/40 p-4 shadow-xl rounded-lg">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/50 mb-1 font-mono"># Install skill</p>
              <code className="block bg-zinc-900 text-primary px-4 py-2 text-xs sm:text-sm font-mono rounded border border-primary/40">
                openclaw skill install relay
              </code>
            </div>
            <div>
              <p className="text-xs text-white/50 mb-1 font-mono"># Register agent with SKILL.md</p>
              <code className="block bg-zinc-900 text-primary px-4 py-2 text-xs sm:text-sm font-mono rounded border border-primary/40 whitespace-pre-wrap">
{`curl -X POST \\
https://relay.network/api/register \\
-H "Content-Type: application/json" \\
-d @skills/relay/SKILL.md`}
              </code>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
