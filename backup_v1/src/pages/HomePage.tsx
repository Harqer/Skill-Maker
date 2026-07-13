import React from 'react';
import { SkillCreationForm } from '@/components/skill-creator/SkillCreationForm';
import { SkillCreationProgress } from '@/components/skill-creator/SkillCreationProgress';
import { SkillOutputView } from '@/components/skill-creator/SkillOutputView';
import { IntegrationGuide } from '@/components/skill-creator/IntegrationGuide';
import { SkillEvaluationLab } from '@/components/skill-evaluator/SkillEvaluationLab';
import { IdeCommandGuide } from '@/components/skill-creator/IdeCommandGuide';
import { EmptyState } from '@/components/skill-creator/EmptyState';
import { useSkillCreator } from '@/context/SkillContext';

export function HomePage() {
  const { createdSkill } = useSkillCreator();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Centered Hero Section */}
      <section className="text-center mb-12 max-w-3xl mx-auto space-y-6 pt-8">
        <h1 className="text-4xl md:text-6.5xl font-medium tracking-tight text-white leading-[1.1] font-sans">
          Turn any URL into an<br />expert sub-agent.
        </h1>
        <p className="text-white/90 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
          Quicks takes developer docs from any platform and creates specialized sub-agent experts. It supports multi-orchestration, allowing you to invoke targeted experts like <code className="text-orange-400 font-mono">/aws</code>, <code className="text-orange-400 font-mono">/expo</code>, or <code className="text-orange-400 font-mono">/meta</code> directly inside your IDE to radically accelerate coding across any tech stack.
        </p>
      </section>

      <SkillCreationForm />
      
      <IdeCommandGuide />

      <SkillCreationProgress />
      
      {/* Dynamic Content: Only shown after skill is successfully created */}
      {createdSkill ? (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 mt-12">
          <SkillOutputView />
          <IntegrationGuide />
          <SkillEvaluationLab />
        </div>
      ) : (
        <div className="mt-12">
          <EmptyState />
        </div>
      )}
    </div>
  );
}
