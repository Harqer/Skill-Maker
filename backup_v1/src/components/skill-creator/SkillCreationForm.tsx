import React, { useState } from 'react';
import { Terminal, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { useSkillCreator } from '@/context/SkillContext';

const SUGGESTIONS = [
  { label: "Expo Guides Overview", url: "https://docs.expo.dev/guides/overview/" },
  { label: "Stripe API Reference", url: "https://docs.stripe.com/api" },
  { label: "Fitbit Web API", url: "https://dev.fitbit.com/build/reference/web-api/" },
  { label: "OpenWeatherMap Docs", url: "https://openweathermap.org/api" },
];

export function SkillCreationForm() {
  const { 
    url, setUrl, 
    includeMcp, setIncludeMcp, 
    customInstructions, setCustomInstructions, 
    isCreating, handleCreate, 
    selectSuggestion
  } = useSkillCreator();
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      {/* Include MCP Support switch/button ABOVE input (Custom Styled, prominent, high contrast) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0d0d12]/60 hover:bg-[#0d0d12]/90 border border-white/5 rounded-2xl p-5 transition-all shadow-xl">
        <div className="space-y-1 bg-transparent">
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-orange-500 uppercase flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Model Context Protocol
          </span>
          <p className="text-white text-xs font-sans leading-relaxed">
            Generate <code className="text-orange-400 font-mono">mcp-server.json</code> to expose these created skills as native tools to Claude Desktop, Cursor, or Windsurf.
          </p>
        </div>
        <button
          type="button"
          onClick={() => !isCreating && setIncludeMcp(!includeMcp)}
          disabled={isCreating}
          className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer select-none shrink-0 ${
            includeMcp
              ? "bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/25"
              : "bg-white/5 text-white/70 border-white/10 hover:border-white/20 hover:text-white"
          }`}
        >
          {includeMcp ? "MCP Protocol Enabled" : "Enable MCP Support"}
        </button>
      </div>

      <form onSubmit={handleCreate} className="relative flex items-center bg-[#0d0d12]/80 border border-white/10 hover:border-white/20 focus-within:border-orange-500/50 rounded-2xl p-2 transition-all shadow-2xl">
        <input
          type="url"
          placeholder="e.g., https://docs.expo.dev/guides/overview/"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isCreating}
          required
          className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none text-sm text-white placeholder-white/30 px-4 py-2.5"
        />
        <button
          type="submit"
          disabled={isCreating || !url}
          className="bg-orange-500 hover:bg-orange-400 text-black font-bold text-xs uppercase px-5 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create
              <span className="text-sm font-normal">→</span>
            </>
          )}
        </button>
      </form>

      {/* Collapsible advanced options toggle */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-[11px] font-mono text-white/50 hover:text-orange-400 transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          {showAdvanced ? "[-] Hide options" : "[+] Add formatting rules or domain scope context"}
        </button>
      </div>

      {/* Collapsible advanced controls container */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-4 pt-1"
          >
            <div className="bg-[#0b0b0f] border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
              {/* Textarea Custom Guidelines */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-widest font-mono">
                  Custom Formatting Directives
                </label>
                <textarea
                  rows={3}
                  placeholder="E.g., Trigger on keyword 'github', force JavaScript validation to use mock fetches only, output clean ESM formats..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  disabled={isCreating}
                  className="w-full bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-orange-500/50 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 outline-none transition-all resize-none font-mono leading-relaxed"
                />
              </div>

              {/* Quick Start Suggestions */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest font-mono">
                  Quick Start Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(sug.url)}
                      disabled={isCreating}
                      className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        url === sug.url
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/30 font-medium"
                          : "bg-white/5 text-gray-300 border-white/5 hover:bg-white/10"
                      }`}
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
