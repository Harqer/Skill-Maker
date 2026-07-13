import React from 'react';
import { Activity, Plus, Trash2, TrendingUp, Play, Loader2 } from 'lucide-react';
import { useSkillCreator } from '@/context/SkillContext';
import { useSkillEvaluator } from '@/hooks/useSkillEvaluator';

export function SkillEvaluationLab() {
  const { createdSkill } = useSkillCreator();
  const {
    testPrompt, setTestPrompt,
    assertions, newAssertion, setNewAssertion, addAssertion, removeAssertion,
    isEvaluating, evaluationResult, evalError,
    feedbackList, newFeedback, setNewFeedback, addFeedback,
    handleEvaluate
  } = useSkillEvaluator();

  if (!createdSkill) return null;

  return (
    <div className="space-y-6 pt-12 mt-12 border-t-2 border-white/10">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
          <Activity className="w-5 h-5 text-orange-400" />
          Subagent IDE Evals
        </h2>
        <p className="text-xs text-white/40 font-mono">
          Run the generated subagent skill against a simulated Antigravity test prompt. Measure instruction following and output quality before deployment.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white font-mono border-b border-white/10 pb-3">
              1. Simulated Task Prompt
            </h3>
            <textarea
              rows={4}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              disabled={isEvaluating}
              className="w-full bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-orange-500/50 rounded-xl p-4 text-xs text-white placeholder-white/20 outline-none transition-all resize-none font-mono leading-relaxed"
            />
          </div>

          <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white font-mono border-b border-white/10 pb-3">
              2. Success Assertions
            </h3>
            <div className="space-y-2">
              {assertions.map((assertion, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <span className="text-[10px] text-orange-400 font-mono pt-0.5 shrink-0">{idx + 1}.</span>
                  <p className="text-xs text-white/70 font-mono leading-relaxed flex-1">{assertion}</p>
                  <button
                    onClick={() => removeAssertion(idx)}
                    disabled={isEvaluating}
                    className="p-1 hover:bg-rose-500/20 text-white/30 hover:text-rose-400 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                value={newAssertion}
                onChange={(e) => setNewAssertion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAssertion())}
                disabled={isEvaluating}
                placeholder="Must include step-by-step auth flow..."
                className="flex-1 bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-orange-500/50 rounded-xl px-4 py-2 text-xs text-white outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={addAssertion}
                disabled={isEvaluating}
                className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Execution & Results */}
        <div className="space-y-6">
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || assertions.length === 0}
            className="w-full py-4 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold rounded-[2rem] shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Evaluator Agent...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform fill-current" />
                <span className="uppercase tracking-widest text-xs">Run Skill Evals</span>
              </>
            )}
          </button>

          {evalError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex gap-3">
              <div className="text-xs text-rose-400 font-mono">{evalError}</div>
            </div>
          )}

          {evaluationResult && (
            <div className="glass p-6 rounded-[2rem] border border-orange-500/30 bg-orange-500/5 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white font-mono flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" /> Eval Results
                </h3>
                <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10 text-xs font-mono">
                  Score: <span className={evaluationResult.score > 70 ? "text-green-400" : "text-orange-400"}>{evaluationResult.score}/100</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold font-mono">Feedback</h4>
                  <p className="text-xs text-white/80 leading-relaxed font-mono bg-black/40 p-4 rounded-xl border border-white/5">
                    {evaluationResult.feedback}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold font-mono">Action Items</h4>
                  <ul className="space-y-2">
                    {evaluationResult.improvements?.map((imp: string, i: number) => (
                      <li key={i} className="text-xs text-orange-300/80 font-mono flex items-start gap-2 bg-orange-500/5 p-3 rounded-xl border border-orange-500/10">
                        <span className="shrink-0 mt-0.5">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Developer Alignment (RLHF) Loop */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 font-bold font-mono">RLHF Correction Feed</h4>
                {feedbackList.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {feedbackList.map((fb, idx) => (
                      <div key={idx} className="text-xs font-mono bg-white/5 p-2 rounded-lg border border-white/5 text-white/60">
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
      </div>
    </div>
  );
}
