export function SnappySphere() {
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="absolute w-full h-full animate-[spin_4s_cubic-bezier(0.85,0,0.15,1)_infinite]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 15" className="text-primary opacity-50" />
      </svg>
      <svg className="absolute w-full h-full animate-[spin_3s_cubic-bezier(0.85,0,0.15,1)_infinite_reverse]" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 10" className="text-primary" />
      </svg>
      <div className="w-2 h-2 bg-primary animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
    </div>
  );
}

export function NetworkNodes() {
  return (
    <svg className="w-full h-full" viewBox="0 0 200 100">
      <path 
        d="M 50,50 L 150,50" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        className="text-primary opacity-30 dashboard-path-anim"
        strokeDasharray="4 4"
      />
      
      {/* Node 1 */}
      <g className="animate-[bounce_2s_cubic-bezier(0.68,-0.55,0.265,1.55)_infinite]">
        <circle cx="50" cy="50" r="10" fill="currentColor" className="text-primary" />
        <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary opacity-50" />
      </g>

      {/* Node 2 */}
      <g className="animate-[bounce_2.5s_cubic-bezier(0.68,-0.55,0.265,1.55)_infinite_0.5s]">
        <circle cx="150" cy="50" r="10" fill="currentColor" className="text-primary" />
        <circle cx="150" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary opacity-50" />
      </g>
      
      <style dangerouslySetInnerHTML={{__html: `
        .dashboard-path-anim {
          animation: dash-flow 1s linear infinite;
        }
        @keyframes dash-flow {
          to {
            stroke-dashoffset: -8;
          }
        }
      `}} />
    </svg>
  );
}
