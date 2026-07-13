import React from 'react';
import { AlertCircle, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { useSkillCreator } from '@/context/SkillContext';

export function SkillCreationProgress() {
  const { errorMessage, isCreating, createStep } = useSkillCreator();

  return (
    <>
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
    </>
  );
}
