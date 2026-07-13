import React, { useState } from 'react';
import { Copy, FileCode, Check } from 'lucide-react';
import { useSkillCreator } from '@/context/SkillContext';

export function SkillOutputView() {
  const { createdSkill, activeTab, setActiveTab, handleFileChange, handleDownloadZip } = useSkillCreator();
  const [copiedText, setCopiedText] = useState(false);

  const handleCopyContent = () => {
    if (!createdSkill || !activeTab) return;
    const content = createdSkill.files[activeTab] || "";
    navigator.clipboard.writeText(content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!createdSkill) {
    return (
      <div className="border-2 border-dashed border-orange-500/20 bg-orange-950/[0.03] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] transition-all relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        
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

  return (
    <div className="flex flex-col gap-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass rounded-2xl border-orange-500/10 bg-orange-500/[0.02]">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Skill Synthesized Successfully
          </h3>
          <span className="text-[10px] text-white/50 font-mono tracking-widest uppercase">
            {createdSkill.folderName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyContent}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 transition-colors text-white text-xs font-semibold rounded-xl border border-white/10"
          >
            {copiedText ? <Check className="w-4 h-4 text-orange-400" /> : <Copy className="w-4 h-4" />}
            {copiedText ? "Copied" : "Copy File"}
          </button>
          <button
            onClick={handleDownloadZip}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 transition-colors text-black text-xs font-semibold rounded-xl shadow-lg"
          >
            <FileCode className="w-4 h-4" />
            Download ZIP
          </button>
        </div>
      </div>

      {/* Code Editor Frame */}
      <div className="glass rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl flex flex-col bg-[#0b0b0f]">
        
        {/* Editor Tabs */}
        <div className="flex border-b border-white/5 overflow-x-auto custom-scrollbar bg-black/40">
          {Object.keys(createdSkill.files).map((fileName) => (
            <button
              key={fileName}
              onClick={() => setActiveTab(fileName)}
              className={`px-6 py-3.5 text-xs font-mono whitespace-nowrap transition-all border-b-2 ${
                activeTab === fileName
                  ? "border-orange-500 text-orange-400 bg-orange-500/5 font-semibold"
                  : "border-transparent text-white/40 hover:bg-white/5 hover:text-white/80"
              }`}
            >
              {fileName}
            </button>
          ))}
        </div>

        {/* Editor Content Area */}
        <div className="relative group">
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <span className="px-2 py-1 bg-white/10 text-white/40 rounded text-[9px] font-mono tracking-wider">EDITABLE</span>
          </div>
          <textarea
            value={createdSkill.files[activeTab] || ""}
            onChange={(e) => handleFileChange(activeTab, e.target.value)}
            spellCheck={false}
            className="w-full h-[500px] p-6 bg-transparent text-gray-300 font-mono text-[13px] leading-relaxed resize-y outline-none custom-scrollbar selection:bg-orange-500/30"
          />
        </div>
      </div>
    </div>
  );
}
