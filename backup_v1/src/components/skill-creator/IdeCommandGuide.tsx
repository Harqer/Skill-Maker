import React from 'react';

export function IdeCommandGuide() {
  return (
    <div className="space-y-4 pt-6 border-t border-white/10">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400 font-mono flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        Multi-Agent Orchestration & IDE Command Protocol
      </h3>
      
      <p className="text-white text-base leading-relaxed font-sans font-medium">
        Summon platform-specific experts in real-time. By mapping distilled <code className="text-orange-400 bg-orange-950/40 px-2 py-0.5 rounded font-mono border border-orange-500/20">SKILL.md</code> files to slash commands inside your IDE (such as Cursor, VS Code Copilot, or Windsurf), you can isolate and invoke complex architectural constraints on-demand without cluttering your global LLM context.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-orange-500 font-bold">/expo</span>
          </div>
          <p className="text-white text-xs leading-relaxed font-sans">
            Invokes the Expo expert. Applies Hermes optimized runtime configurations, native dependency boundaries, and strict build pipelines.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-orange-500 font-bold">/aws</span>
          </div>
          <p className="text-white text-xs leading-relaxed font-sans">
            Summons the AWS Cloud expert. Immediately audits Serverless architectures, IAM lease credentials, and minimizes cold starts.
          </p>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-orange-500 font-bold">/meta-wear</span>
          </div>
          <p className="text-white text-xs leading-relaxed font-sans">
            Triggers wearable guidelines. Enforces lightweight state management, strict battery budgeting, and spatial UI constraints.
          </p>
        </div>
      </div>

      <p className="text-white/90 text-xs font-sans leading-relaxed pt-2">
        To activate, save the created <code className="text-orange-400 font-mono">SKILL.md</code> in your workspace rules directory (e.g., <code className="text-orange-300 font-mono">.cursorrules</code>, <code className="text-orange-300 font-mono">.github/copilot-instructions.md</code>) or import it as an active system context trigger to run multi-agent routines simultaneously.
      </p>
    </div>
  );
}
