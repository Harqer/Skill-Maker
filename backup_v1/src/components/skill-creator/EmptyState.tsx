import React from 'react';

export function EmptyState() {
  return (
    <div className="border-2 border-dashed border-orange-500/20 bg-orange-950/[0.03] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] transition-all relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none" />
      
      {/* Orange rounded-corner square with orange lines (representing a card/document) */}
      <div className="w-14 h-14 rounded-2xl bg-orange-950/60 border-2 border-orange-500/30 flex flex-col justify-center items-center gap-2 p-3 mb-4 shrink-0 shadow-lg shadow-orange-500/5">
        <div className="w-full h-1 bg-orange-400/60 rounded-full" />
        <div className="w-4/5 h-1 bg-orange-400/40 rounded-full self-start" />
        <div className="w-full h-1 bg-orange-400/30 rounded-full" />
      </div>

      <span className="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-2 block">
        Empty
      </span>
      
      <p className="text-white/35 text-xs max-w-sm leading-relaxed font-sans">
        No skill cards created yet. Paste a developer documentation link above and click Create to start distilling expertise.
      </p>
    </div>
  );
}
