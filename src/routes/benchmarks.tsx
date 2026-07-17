import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { BarChart2, Zap, Brain, MessageSquare, Play, Loader2 } from 'lucide-react'
import { getSkillById, evaluateSkill } from '@/server/skills'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/benchmarks')({
  head: () => ({
    meta: [
      { title: 'Benchmarks - Skill Maker' },
      { name: 'description', content: 'Test and benchmark your LLM agents with Langsmith and Langgraph.' }
    ]
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      skillId: search.skillId as string | undefined,
    }
  },
  loaderDeps: ({ search: { skillId } }) => ({ skillId }),
  loader: async ({ deps: { skillId } }) => {
    if (skillId) {
      try {
        const skill = await getSkillById({ data: skillId })
        return { skill }
      } catch (e) {
        console.error(e)
        return { skill: null }
      }
    }
    return { skill: null }
  },
  component: BenchmarksPage,
})

function BenchmarksPage() {
  const { skill } = Route.useLoaderData()

  return (
    <div className="container py-4 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col gap-2 mb-4 border-b border-border/50 pb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 font-serif">
          <BarChart2 className="h-8 w-8 text-primary" />
          SkillOpt Dashboard
        </h1>
        <p className="text-muted-foreground font-medium">
          Train and evaluate your agent skills using the <span className="font-semibold text-primary">SkillOpt</span> optimizer and <span className="font-semibold text-primary">Langsmith</span>.
        </p>
      </div>

      <div className="flex-1 w-full rounded-xl border border-primary/20 overflow-hidden shadow-lg bg-card relative">
        <iframe 
          src="http://localhost:7860" 
          className="absolute inset-0 w-full h-full border-0"
          title="SkillOpt WebUI"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  )
}
