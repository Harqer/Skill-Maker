import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import SkillCard from '@/components/skills/SkillCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Sparkles, Loader2, Bot, Library, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { getSkills } from '@/server/skills'
import { generateSkillFromUrl, getGenerationStatus } from '@/server/ai'
import { useServerFn } from '@tanstack/react-start'
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Zap - Production AI Agent Skills' },
      { name: 'description', content: 'Discover, share, and deploy specialized skills for your autonomous AI agents.' }
    ]
  }),
  loader: async () => {
    return {
      trendingSkills: await getSkills({ data: undefined })
    }
  },
  component: Home,
})

const aiFormSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  include_mcp: z.boolean().default(false),
})

type AiFormValues = z.infer<typeof aiFormSchema>

function Home() {
  const { trendingSkills } = Route.useLoaderData()
  const navigate = useNavigate()
  
  const generateFn = useServerFn(generateSkillFromUrl)
  const pollStatusFn = useServerFn(getGenerationStatus)
  
  const [serverError, setServerError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [pollingDbId, setPollingDbId] = useState<number | null>(null)
  const [generationStatus, setGenerationStatus] = useState<string>('')
  
  const aiForm = useForm<AiFormValues>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      url: '',
      prompt: '',
      include_mcp: false,
    }
  })

  const onAiSubmit = async (data: AiFormValues) => {
    setServerError(null)
    try {
      setIsGenerating(true)
      setGenerationStatus("Starting generation...")
      
      const res = await generateFn({ data })
      if (res.status === "enqueued" && res.db_id) {
        setPollingDbId(res.db_id)
      } else {
        throw new Error("Failed to enqueue AI generation")
      }
    } catch (error: any) {
      setIsGenerating(false)
      setServerError(error.message || "Failed to trigger AI Agent.")
    }
  }

  useEffect(() => {
    if (!pollingDbId) return;

    const interval = setInterval(async () => {
      try {
        const res = await pollStatusFn({ data: pollingDbId });
        setGenerationStatus(`Agent status: ${res.status}`);
        
        if (res.status === 'completed') {
          clearInterval(interval);
          setIsGenerating(false);
          setPollingDbId(null);
          
          if (res.createdSkill) {
             alert("Generation complete! Check the Submit page to review and publish.")
          }
        } else if (res.status === 'failed') {
          clearInterval(interval);
          setIsGenerating(false);
          setPollingDbId(null);
          setServerError(`Generation failed: ${res.error}`);
        }
      } catch (e: any) {
        console.error(e);
        clearInterval(interval);
        setIsGenerating(false);
        setPollingDbId(null);
        setServerError("Lost connection to generation status");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pollingDbId, pollStatusFn, navigate]);

  const { user } = useUser()

  return (
    <div className="container py-16 max-w-5xl mx-auto space-y-16 animate-in fade-in duration-500">
      


      {/* Hero Headings */}
      <div className="flex flex-col gap-6 max-w-3xl">
        <h1 className="text-5xl sm:text-6xl font-serif text-foreground leading-[1.1] tracking-tight">
          Craft AI skills.<br/>
          <span className="text-primary italic">Benchmark</span> them like prose.
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">
          Turn a prompt into a reusable skill, define test cases with expected outputs,
          and run benchmarks that measure quality, latency, and token cost across
          models — with the care of a well-kept notebook.
        </p>
      </div>

      {/* URL Input Area (Pill-shaped) */}
      <div className="flex flex-col items-center gap-3 w-full max-w-3xl mt-8">
        <SignedOut>
           <div className="w-full flex flex-col items-center gap-4 py-4 px-6 rounded-2xl bg-card border border-border/60">
             <p className="text-sm text-muted-foreground text-center">
               Sign in to generate skills from any documentation URL.
             </p>
             <SignInButton mode="modal">
               <Button variant="outline" size="sm" className="rounded-full px-6">
                 Sign in to get started
               </Button>
             </SignInButton>
           </div>
         </SignedOut>
         <SignedIn>
        <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="w-full">
          <div className="relative flex items-center w-full shadow-sm bg-white border border-border rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <div className="pl-4 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <input 
              id="url"
              type="text"
              placeholder="https://developer.android.com/develop" 
              {...aiForm.register("url")}
              className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <div className="pr-1.5 py-1.5">
              <Button type="submit" disabled={isGenerating} size="sm" className="rounded-full px-5 bg-[#d4a8a3] hover:bg-primary text-white transition-colors h-9">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 h-3.5 w-3.5"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="hidden">
             {/* Hidden form fields from original design */}
             <Textarea {...aiForm.register("prompt")} value="Analyze this URL and create a skill." />
             <input type="checkbox" {...aiForm.register("include_mcp")} />
          </div>
        </form>
        <p className="text-xs text-muted-foreground italic tracking-wide">
          {generationStatus || "Drop in a link and we'll pass it to your active skill."}
        </p>
        {serverError && !isGenerating && (
          <p className="text-sm text-destructive font-medium">{serverError}</p>
        )}
        </SignedIn>
      </div>

      <div className="space-y-6 pt-10">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h2 className="text-xl font-bold font-serif text-foreground">Your skills</h2>
          <span className="text-xs text-muted-foreground font-medium">{trendingSkills.length} skills</span>
        </div>
        
        {trendingSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingSkills.map((skill) => (
              <SkillCard 
                key={skill.id} 
                id={skill.id}
                title={skill.title}
                description={skill.description}
                content={skill.content}
                authorName={skill.authorId}
                tags={skill.tags}
                upvotes={skill.upvotes}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 mt-4 border border-dashed border-border/60 rounded-xl bg-card/30 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Library className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground font-serif">No skills yet</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Create your first skill to start experimenting. Skills are prompts wrapped with a model and evaluated against test cases.
            </p>
            <Link to="/submit">
              <Button className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <Plus className="w-4 h-4 mr-2" />
                Create your first skill
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
