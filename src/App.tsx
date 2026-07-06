import React, { useState } from "react";
import {
  Sparkles,
  Globe,
  FileCode,
  Terminal,
  Copy,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Play,
  Plus,
  Trash2,
  Activity,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";
import { CreatedSkill } from "./types";
import { ParticlesBackground } from "./components/ParticlesBackground";
import { OrigamiCrowLogo } from "./components/OrigamiCrowLogo";

// Predefined doc suggestions for quick exploration
const SUGGESTIONS = [
  { label: "Expo Guides Overview", url: "https://docs.expo.dev/guides/overview/" },
  { label: "Stripe API Reference", url: "https://docs.stripe.com/api" },
  { label: "Fitbit Web API", url: "https://dev.fitbit.com/build/reference/web-api/" },
  { label: "OpenWeatherMap Docs", url: "https://openweathermap.org/api" },
];

export default function App() {
  const [url, setUrl] = useState("");
  const [includeMcp, setIncludeMcp] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Created skill output
  const [createdSkill, setCreatedSkill] = useState<CreatedSkill | null>(null);
  const [activeTab, setActiveTab] = useState<string>("SKILL.md");
  const [copiedText, setCopiedText] = useState(false);
  const [snippetCopied, setSnippetCopied] = useState(false);

  // Restore Templates handler
  const handleRestoreTemplates = () => {
    setUrl("");
    setCustomInstructions("");
    setIncludeMcp(false);
    setCreatedSkill(null);
    setErrorMessage("");
    setEvaluationResult(null);
  };

  // Subagent Testing Lab & Evaluation States
  const [testPrompt, setTestPrompt] = useState<string>("Develop a complete configuration setup for an integrated pipeline, validating all credentials and handling failure conditions safely.");
  const [assertions, setAssertions] = useState<string[]>([
    "Correctly authenticates with credentials",
    "Handles network timeout or bad response gracefully",
    "Uses correct parameter formatting based on target guidelines"
  ]);
  const [newAssertion, setNewAssertion] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);
  const [feedbackList, setFeedbackList] = useState<string[]>([]);
  const [newFeedback, setNewFeedback] = useState<string>("");
  const [evalError, setEvalError] = useState<string>("");

  const addAssertion = () => {
    if (!newAssertion.trim()) return;
    setAssertions([...assertions, newAssertion.trim()]);
    setNewAssertion("");
  };

  const removeAssertion = (index: number) => {
    setAssertions(assertions.filter((_, i) => i !== index));
  };

  const addFeedback = () => {
    if (!newFeedback.trim()) return;
    setFeedbackList([...feedbackList, newFeedback.trim()]);
    setNewFeedback("");
  };

  const handleEvaluate = async () => {
    if (!createdSkill) return;
    setIsEvaluating(true);
    setEvalError("");
    setEvaluationResult(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: testPrompt,
          skillContent: createdSkill.files["SKILL.md"] || "",
          assertions: assertions,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Evaluation run failed.");
      }

      const data = await response.json();
      setEvaluationResult(data);
    } catch (err: any) {
      console.error("Evaluation error:", err);
      setEvalError(err.message || "An unexpected error occurred during evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // Pre-fill fields for Suggestion URLs
  const selectSuggestion = (targetUrl: string) => {
    setUrl(targetUrl);
    setErrorMessage("");
  };

  // Triggering the creation request
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      setErrorMessage("Please enter a documentation URL to create.");
      return;
    }

    setIsCreating(true);
    setCreateStep(1); // Scraper step
    setErrorMessage("");
    setCreatedSkill(null);

    // Simulated step timer to make UI immersive and satisfying
    const stepInterval = setInterval(() => {
      setCreateStep((prev) => {
        if (prev < 4) return prev + 1;
        return prev;
      });
    }, 2800);

    try {
      const response = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          includeMcp,
          customInstructions,
        }),
      });

      clearInterval(stepInterval);

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || "Failed to create skill");
      }

      const data: CreatedSkill = await response.json();
      setCreateStep(5); // Complete
      setCreatedSkill(data);
      // Select the first tab dynamically
      if (data.files["SKILL.md"]) {
        setActiveTab("SKILL.md");
      } else {
        const firstFile = Object.keys(data.files)[0];
        setActiveTab(firstFile || "");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setErrorMessage(err.message || "An unexpected error occurred while creating the skill.");
      setIsCreating(false);
    }
  };

  // Update file contents if user types in our custom code editor
  const handleFileChange = (fileName: string, value: string) => {
    if (!createdSkill) return;
    setCreatedSkill({
      ...createdSkill,
      files: {
        ...createdSkill.files,
        [fileName]: value,
      },
    });
  };

  // Copy code tab contents to clipboard
  const handleCopyContent = () => {
    if (!createdSkill || !activeTab) return;
    const content = createdSkill.files[activeTab] || "";
    navigator.clipboard.writeText(content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Download client-side JSZip
  const handleDownloadZip = async () => {
    if (!createdSkill) return;
    try {
      const zip = new JSZip();
      const folder = zip.folder(createdSkill.folderName) || zip;

      Object.entries(createdSkill.files).forEach(([pathName, content]) => {
        if (content) {
          folder.file(pathName, content);
        }
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const dlUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = dlUrl;
      link.download = `${createdSkill.folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("ZIP Generation error:", err);
      setErrorMessage("Could not generate ZIP bundle.");
    }
  };

  // Copy Auto-Orchestration Snippet
  const handleCopySnippet = (code: string) => {
    navigator.clipboard.writeText(code);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  // Snippet template
  const orchestrationSnippet = createdSkill
    ? `# 📂 AI Studio Subagent Skill Directory Configuration:
#
# Taxonomy:
# 1. Global Agents: Dedicated subagent skillsets belong in the '.agents/skills/' directory:
#    .agents/skills/${createdSkill.folderName}/
#      ├── SKILL.md
#      ├── scripts/validate.js
#      └── references/source.md
#
# 2. Project Guidelines: Core workspace agent directives & rules belong in 'AGENTS.md'
#    (or 'GEMINI.md') located at the project root.
#
# To register and orchestrate this global subagent dynamically, implement a LangChain node:

import os
import yaml
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI

SKILL_DIR = ".agents/skills/${createdSkill.folderName}"

@tool
def execute_${createdSkill.folderName.replace(/-/g, "_")}_validation() -> str:
    """Execute the created validation scripts for ${createdSkill.displayName}."""
    import subprocess
    script_path = os.path.join(SKILL_DIR, "scripts", "validate.js")
    result = subprocess.run(["node", script_path], capture_output=True, text=True)
    return result.stdout if result.returncode == 0 else f"Error: {result.stderr}"

# 1. Parse your created SKILL.md instructions as system prompt directives
with open(os.path.join(SKILL_DIR, "SKILL.md"), "r") as f:
    skill_manifest = f.read()

# 2. Create the Subagent's custom orchestration flow
prompt = ChatPromptTemplate.from_messages([
    ("system", f"You are a specialized subagent managing ${createdSkill.displayName}.\\nUse the tools provided below to operate on the target integrations according to the rules:\\n{skill_manifest}"),
    ("placeholder", "{agent_scratchpad}"),
])

# 3. Create the LangChain Agent Runner
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
tools = [execute_${createdSkill.folderName.replace(/-/g, "_")}_validation()]
agent = create_openai_tools_agent(llm, tools, prompt)
subagent_executor = AgentExecutor(agent=agent, tools=tools)`
    : "";

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-orange-500/25 selection:text-orange-400 overflow-x-hidden relative">
      {/* Slow Drifting Particles Background with elegant gradient */}
      <ParticlesBackground />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/10 via-[#050505] to-[#050505] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Main Container */}
      <main className="relative max-w-3xl mx-auto px-6 py-12 z-10">
        
        {/* Navigation / Header Row */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-16 gap-6 border-b-2 border-orange-500 pb-6">
          <div className="flex items-center gap-4.5">
            <OrigamiCrowLogo size={60} />
            <div className="flex flex-col items-start">
              <h1 className="text-3xl font-bold tracking-tight text-white font-sans">
                Quicks
              </h1>
              <span className="text-[10px] text-orange-400 font-mono tracking-wider uppercase font-bold">
                make expert subagents for any platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs uppercase tracking-tighter">
            <span className="text-white/60 hover:text-white transition-colors cursor-pointer font-medium font-sans">STUDIO</span>
            <button
              type="button"
              onClick={handleRestoreTemplates}
              className="px-3 py-1.5 border border-white/10 hover:border-orange-500/30 text-white/80 hover:text-white rounded-lg text-[10px] tracking-widest uppercase transition-all bg-transparent cursor-pointer font-mono font-bold"
            >
              RESTORE TEMPLATES
            </button>
          </div>
        </header>

        {/* Centered Hero Section */}
        <section className="text-center mb-12 max-w-3xl mx-auto space-y-6 pt-8">
          <h1 className="text-4xl md:text-6.5xl font-medium tracking-tight text-white leading-[1.1] font-sans">
            Turn any URL into an<br />expert sub-agent.
          </h1>
          <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Quicks takes developer docs from any platform and creates specialized sub-agent experts. It supports multi-orchestration, allowing you to invoke targeted experts like <code className="text-orange-400 font-mono">/aws</code>, <code className="text-orange-400 font-mono">/expo</code>, or <code className="text-orange-400 font-mono">/meta</code> directly inside your IDE to radically accelerate coding across any tech stack.
          </p>
        </section>

        {/* Centered Single-Column Vertical Layout */}
        <div className="space-y-8 max-w-3xl mx-auto">
          
          {/* Form / Input Options Section */}
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

            <div className="text-center pt-2">
              <span className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase">
                PASTE · DISTILL · DEPLOY
              </span>
            </div>

            {/* Error Card */}
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3 glass">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-400">Creation Process Interrupted</p>
                  <p className="text-gray-300 mt-1">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Simulated Live Stepper (only visible while creating) */}
            <AnimatePresence>
              {isCreating && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass p-6 space-y-4 shadow-xl"
                >
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                    Creation Pipeline Progress
                  </h4>
                  <div className="space-y-3.5 pt-2">
                    {[
                      { step: 1, label: "Scraping & Crawling Target HTML" },
                      { step: 2, label: "Cleaning Page Markups & Scripts" },
                      { step: 3, label: "Analyzing via Gemini AI Meta-Prompt" },
                      { step: 4, label: "Structuring assets" },
                    ].map((st) => {
                      const isActive = createStep === st.step;
                      const isDone = createStep > st.step;
                      return (
                        <div key={st.step} className="flex items-center justify-between text-xs">
                          <span
                            className={`transition-colors font-medium ${
                              isActive ? "text-orange-400 font-semibold" : isDone ? "text-white/60" : "text-white/30"
                            }`}
                          >
                            {st.step}. {st.label}
                          </span>
                          {isDone ? (
                            <Check className="w-4 h-4 text-orange-400 shrink-0" />
                          ) : isActive ? (
                            <span className="flex h-2 w-2 relative shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                            </span>
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/10 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Multi-Agent IDE Integration & Command Guide (Bossy, high-contrast typography, not a card) */}
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

          {/* Skill Cards Output Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 flex items-center gap-2 font-mono">
                <FileCode className="w-4 h-4 text-orange-400" />
                Skill Cards
              </h3>
              {createdSkill && (
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950/25 px-2 py-0.5 rounded border border-orange-500/20 uppercase tracking-widest font-bold animate-pulse">
                  ACTIVE CARD
                </span>
              )}
            </div>

            {createdSkill ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                
                {/* Result Meta Banner */}
                <div className="glass p-6 skill-card relative overflow-hidden accent-glow">
                  <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/25 uppercase font-mono">
                          {createdSkill.folderName}
                        </span>
                        <span className="text-white/40 text-[10px] flex items-center gap-1 font-mono uppercase tracking-widest font-bold">
                          <Check className="w-3.5 h-3.5 text-orange-400" />
                          CREATED SUCCESSFULLY
                        </span>
                      </div>
                      <h3 className="text-xl font-medium text-white mt-1.5">{createdSkill.displayName}</h3>
                      <p className="text-xs text-white/60 mt-1.5">{createdSkill.description}</p>
                    </div>

                    <button
                      onClick={handleDownloadZip}
                      className="px-5 py-2.5 bg-white hover:bg-orange-400 text-black font-bold uppercase tracking-widest text-[10px] rounded-lg transition-colors shrink-0 cursor-pointer accent-glow"
                    >
                      Export ZIP
                    </button>
                  </div>
                </div>

                {/* Tabbed Code Editor */}
                <div className="glass overflow-hidden">
                  
                  {/* Editor Header / Tab bar */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-white/10 bg-white/[0.02] px-4 py-2.5 gap-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {Object.keys(createdSkill.files).map((fileName) => {
                        const isTabActive = activeTab === fileName;
                        return (
                          <button
                            key={fileName}
                            onClick={() => setActiveTab(fileName)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-mono transition-all cursor-pointer ${
                              isTabActive
                                ? "bg-white/10 text-orange-400"
                                : "text-white/40 hover:text-white/80"
                            }`}
                          >
                            {fileName}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={handleCopyContent}
                        className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/5 transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer"
                        title="Copy file content"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedText ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Interactive Editable Content Area */}
                  <div className="relative">
                    <textarea
                      value={createdSkill.files[activeTab] || ""}
                      onChange={(e) => handleFileChange(activeTab, e.target.value)}
                      rows={18}
                      className="w-full bg-[#050505]/80 text-white font-mono text-xs p-5 outline-none resize-none leading-relaxed border-0 focus:ring-0 select-text"
                      spellCheck={false}
                    />
                    <div className="absolute bottom-3 right-4 text-[10px] text-white/20 font-mono pointer-events-none">
                      Interactive Code Sandbox • Editable
                    </div>
                  </div>
                </div>

                {/* Auto-Orchestration Code Snippets Card */}
                <div className="glass p-6 accent-glow space-y-4">
                  <h4 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-orange-400" />
                    Agentic Orchestration Integration
                  </h4>
                  <p className="text-xs text-white/40">
                     Inject this automation logic in LangGraph, CrewAI, or Pydantic AI to dynamically unpack and use the skill:
                  </p>
                  <div className="bg-[#050505] border border-white/5 rounded-xl p-4 font-mono text-xs text-white relative group">
                    <pre className="overflow-x-auto whitespace-pre select-all pr-12">{orchestrationSnippet}</pre>
                    <button
                      onClick={() => handleCopySnippet(orchestrationSnippet)}
                      className="absolute top-3 right-3 p-1 text-white/40 hover:text-white rounded bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Copy Snippet"
                    >
                      {snippetCopied ? <Check className="w-3.5 h-3.5 text-orange-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Subagent Testing Lab & Evaluation Suite */}
                <div className="glass p-6 accent-glow space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <Activity className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-semibold text-white">Subagent Evaluation Lab</h4>
                        <p className="text-xs text-white/40">Benchmark guidelines against actual model runs with quantitative verification</p>
                      </div>
                    </div>
                  </div>

                  {/* Test prompt & Assertions Configuration */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-white/60 uppercase tracking-wider font-mono">
                        Test Scenario / User Prompt
                      </label>
                      <textarea
                        value={testPrompt}
                        onChange={(e) => setTestPrompt(e.target.value)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-3 text-xs text-white placeholder-white/20 outline-none transition-all resize-none font-mono"
                        placeholder="Define a complex prompt to test the model's adherence to the created rules..."
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium text-white/60 uppercase tracking-wider font-mono">
                        Quantitative Assertions / Thresholds
                      </label>
                      
                      {/* Assertion List */}
                      <div className="space-y-2">
                        {assertions.map((assertion, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-white/80">
                            <span className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                              {assertion}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAssertion(index)}
                              className="text-white/40 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Assertion */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAssertion}
                          onChange={(e) => setNewAssertion(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAssertion())}
                          placeholder="e.g. Must include error codes or retry tips..."
                          className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={addAssertion}
                          className="px-3.5 py-2 bg-white/10 hover:bg-orange-500 hover:text-black transition-all rounded-xl text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Run evaluation trigger button */}
                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <button
                        type="button"
                        onClick={handleEvaluate}
                        disabled={isEvaluating}
                        className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-orange-400 disabled:bg-white/5 disabled:text-white/20 text-black font-bold uppercase tracking-widest text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 accent-glow shrink-0"
                      >
                        {isEvaluating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                            Evaluating Subagents...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            Run Subagent Benchmarks
                          </>
                        )}
                      </button>

                      <div className="text-[10px] text-white/40 font-mono text-center sm:text-right">
                        Compares baseline (without skill) vs guided subagent runs
                      </div>
                    </div>

                    {evalError && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-xs text-rose-400 font-medium font-mono">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        Evaluation Error: {evalError}
                      </div>
                    )}
                  </div>

                  {/* Active Loading steps or Interactive Evals Output */}
                  {isEvaluating && (
                    <div className="p-6 bg-[#050505]/60 border border-white/5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-3 text-sm font-mono text-orange-400">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                        Pipeline executing comparative evaluations...
                      </div>
                      <div className="space-y-2.5 font-mono text-[11px] text-white/40">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                          <span>1. Initializing clean Baseline model without SKILL.md guidelines...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
                          <span>2. Spawning Guided subagent leveraging created operational parameters...</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/20">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/10 flex items-center justify-center text-[8px] font-bold">3</span>
                          <span>3. Objective grading against defined quantitative assertions...</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/20">
                          <span className="w-3.5 h-3.5 rounded-full border border-white/10 flex items-center justify-center text-[8px] font-bold">4</span>
                          <span>4. Guidance footprint & token count calculations...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Report Results */}
                  {evaluationResult && (
                    <div className="space-y-6">
                      
                      {/* Metric Bento Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Correctness Bento Item */}
                        <div className="bg-[#050505]/40 border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full blur-xl" />
                          <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Pass Rate Improvement</div>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-2xl font-bold text-white">
                              {evaluationResult.withSkill.grades.filter((g: any) => g.passed).length} / {assertions.length}
                            </span>
                            <span className="text-xs font-mono text-white/40">
                              vs {evaluationResult.baseline.grades.filter((g: any) => g.passed).length} / {assertions.length} in baseline
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>
                              {evaluationResult.withSkill.grades.filter((g: any) => g.passed).length >= evaluationResult.baseline.grades.filter((g: any) => g.passed).length 
                                ? "Correctness threshold achieved"
                                : "Check guidelines for correctness gaps"}
                            </span>
                          </div>
                        </div>

                        {/* Token Density Bento Item */}
                        <div className="bg-[#050505]/40 border border-white/5 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/5 rounded-full blur-xl" />
                          <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">Token Guidance Footprint</div>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-2xl font-bold text-amber-400">
                              {evaluationResult.withSkill.total_tokens}
                            </span>
                            <span className="text-xs font-mono text-white/40">
                              vs {evaluationResult.baseline.total_tokens} baseline
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-white/30">
                            Estimated token footprint for full context matching
                          </div>
                        </div>

                      </div>

                      {/* Assertion Grades detail and evidence */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono">
                          Assertion Verification Details (With Skill)
                        </h5>
                        <div className="space-y-3">
                          {evaluationResult.withSkill.grades.map((grade: any, i: number) => (
                            <div key={i} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full ${grade.passed ? "bg-emerald-400" : "bg-rose-400"}`} />
                                  {grade.assertion}
                                </span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                                  grade.passed 
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                                }`}>
                                  {grade.passed ? "PASSED" : "FAILED"}
                                </span>
                              </div>
                              <p className="text-xs text-white/50 leading-relaxed font-sans pl-3.5">
                                <span className="font-mono text-[10px] text-white/30 font-bold">Reasoning / Evidence:</span> {grade.evidence}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Comparative Output Explorer */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono">
                          Output Vibe Match & Quality Comparison
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          {/* Baseline output */}
                          <div className="space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-white/40">
                              Baseline output (No Skill)
                            </div>
                            <div className="bg-[#050505] border border-white/5 rounded-2xl p-4 text-xs font-mono text-white/60 h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                              {evaluationResult.baseline.output}
                            </div>
                          </div>

                          {/* With Skill Output */}
                          <div className="space-y-2">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-orange-400">
                              Optimized output (Guided by Created Skill)
                            </div>
                            <div className="bg-[#050505] border border-orange-500/10 rounded-2xl p-4 text-xs font-mono text-white h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                              {evaluationResult.withSkill.output}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Stateful Developer Feedback Log */}
                      <div className="space-y-3 border-t border-white/5 pt-4">
                        <h5 className="text-xs font-semibold text-white/80 uppercase tracking-wider font-mono">
                          Iterative Review Feedback History
                        </h5>
                        
                        {feedbackList.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {feedbackList.map((fb, idx) => (
                              <div key={idx} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/70 font-sans leading-relaxed">
                                <span className="font-mono text-[9px] text-white/30 block mb-0.5">ITERATION {idx + 1} REVIEW:</span>
                                {fb}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFeedback}
                            onChange={(e) => setNewFeedback(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeedback())}
                            placeholder="Add developer review feedback for this iteration..."
                            className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all"
                          />
                          <button
                            type="button"
                            onClick={addFeedback}
                            className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500 hover:text-black transition-all text-orange-400 text-xs font-semibold rounded-xl"
                          >
                            Add Log
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              // Empty State view: Elegant orange rounded-corner square empty placeholder card
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
            )}
          </div>

        </div>

      </main>

      {/* Styled Footer */}
      <footer className="border-t border-white/5 py-8 mt-24 text-center text-xs text-gray-500 font-mono relative z-10 flex flex-col items-center justify-center gap-2">
        <OrigamiCrowLogo size={20} className="opacity-30" />
        <p>© 2026 Quicks • Make expert subagents for any platform</p>
      </footer>
    </div>
  );
}
