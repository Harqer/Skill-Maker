import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
import { useSkillCreator } from '@/context/SkillContext';

export function IntegrationGuide() {
  const { createdSkill } = useSkillCreator();
  const [snippetCopied, setSnippetCopied] = useState(false);

  const handleCopySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  const mcpGuide = createdSkill
    ? `To use your new MCP server:

1. Copy the generated files (mcp_server.py) to a folder on your machine.
2. If using Cursor, go to Settings -> Features -> MCP, click "+ Add New MCP Server":
   - Name: ${createdSkill.folderName}
   - Type: command
   - Command: uv run --with fastmcp mcp_server.py
3. If using Claude Desktop, add the contents of mcp_config.json to your claude_desktop_config.json file.
4. Restart your IDE/Client to register the new tools.`
    : "";

  return (
    <div className="space-y-4 pt-6 border-t border-white/10">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-orange-400 font-mono flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
        Multi-Agent Orchestration & IDE Command Protocol
      </h3>
      <p className="text-xs text-white/50 leading-relaxed max-w-2xl font-mono">
        Inject the generated subagent into your workspace or multi-agent orchestration frameworks (e.g., LangChain, AutoGen). 
        {createdSkill?.files["mcp-server.json"] && " Connect your IDE directly to this skill via the generated MCP configuration."}
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Antigravity IDE (Gemini) */}
        <div className="glass p-5 rounded-2xl border-white/5 space-y-4 hover:border-orange-500/20 transition-all">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Antigravity SDK</h4>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[9px] font-mono text-white/50 border border-white/10">
              <Terminal className="w-3 h-3" /> native
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-white/40 font-mono">Add this to your agent prompt or configuration:</p>
            <div className="relative group/code">
              <pre className="bg-[#0b0b0f] p-3 rounded-xl border border-white/5 text-[10px] font-mono text-white/60 overflow-x-auto">
                <code>
{`<invoke_subagent>
  <type>${createdSkill?.folderName || "skill-name"}</type>
  <prompt>Solve the task based on your documentation expertise.</prompt>
</invoke_subagent>`}
                </code>
              </pre>
              <button
                type="button"
                onClick={() => handleCopySnippet(`<invoke_subagent>\n  <type>${createdSkill?.folderName || "skill-name"}</type>\n  <prompt>Solve the task based on your documentation expertise.</prompt>\n</invoke_subagent>`)}
                className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg opacity-0 group-hover/code:opacity-100 transition-all text-white"
              >
                {snippetCopied ? <Check className="w-3 h-3 text-orange-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        {/* MCP Configuration Details */}
        {createdSkill?.files["mcp-server.json"] && (
          <div className="glass p-5 rounded-2xl border-white/5 space-y-4 hover:border-orange-500/20 transition-all">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">MCP Configuration</h4>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-orange-500/10 text-[9px] font-mono text-orange-400 border border-orange-500/20">
                <Terminal className="w-3 h-3" /> active
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] text-white/40 font-mono">Follow these steps to connect your IDE (Cursor/Claude):</p>
              <div className="relative group/code">
                <pre className="bg-[#0b0b0f] p-3 rounded-xl border border-white/5 text-[10px] font-mono text-white/60 overflow-x-auto whitespace-pre-wrap">
                  <code>{mcpGuide}</code>
                </pre>
                <button
                  type="button"
                  onClick={() => handleCopySnippet(mcpGuide)}
                  className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg opacity-0 group-hover/code:opacity-100 transition-all text-white"
                >
                  {snippetCopied ? <Check className="w-3 h-3 text-orange-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
