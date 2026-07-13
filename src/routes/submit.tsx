import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSkill } from '../server/skills'
import { generateSkillFromUrl, getGenerationStatus } from '../server/ai'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Sparkles, Loader2, Bot } from 'lucide-react'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/submit')({
  head: () => ({
    meta: [
      { title: 'Submit a Skill - Skill Maker' },
      { name: 'description', content: 'Share your agent skills with the community.' }
    ]
  }),
  component: SubmitPage,
})

const manualFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  content: z.string().min(20, 'Prompt content must be at least 20 characters'),
  tagsString: z.string().min(1, 'Add at least one tag'),
})

const aiFormSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  include_mcp: z.boolean().default(false),
})

type ManualFormValues = z.infer<typeof manualFormSchema>
type AiFormValues = z.infer<typeof aiFormSchema>

function SubmitPage() {
  const navigate = useNavigate()
  const submitFn = useServerFn(createSkill)
  const generateFn = useServerFn(generateSkillFromUrl)
  const pollStatusFn = useServerFn(getGenerationStatus)
  
  const [serverError, setServerError] = useState<string | null>(null)
  
  // AI Polling State
  const [isGenerating, setIsGenerating] = useState(false)
  const [pollingDbId, setPollingDbId] = useState<number | null>(null)
  const [generationStatus, setGenerationStatus] = useState<string>('')
  
  const manualForm = useForm<ManualFormValues>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      tagsString: '',
    }
  })

  const aiForm = useForm<AiFormValues>({
    resolver: zodResolver(aiFormSchema),
    defaultValues: {
      url: '',
      prompt: '',
      include_mcp: false,
    }
  })

  const onManualSubmit = async (data: ManualFormValues) => {
    setServerError(null)
    const tags = data.tagsString.split(',').map(t => t.trim()).filter(Boolean)
    
    if (tags.length === 0 || tags.length > 5) {
      setServerError("Please provide between 1 and 5 tags separated by commas.")
      return
    }

    try {
      const result = await submitFn({
        data: {
          title: data.title,
          description: data.description,
          content: data.content,
          tags,
        }
      })
      
      if (result.success) {
        navigate({ to: '/' })
      }
    } catch (error: any) {
      setServerError(error.message || "Failed to submit skill. Please try again.")
    }
  }

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
          
          // Switch to manual form and populate it with generated content
          if (res.createdSkill) {
            manualForm.setValue('content', res.createdSkill.files['SKILL.md'] || '');
            manualForm.setValue('title', 'AI Generated Skill');
            manualForm.setValue('description', res.createdSkill.description || '');
            manualForm.setValue('tagsString', 'ai, generated');
            
            // Assuming there's a state for active tab we could switch it here,
            // but for simplicity we rely on the user seeing the form updated.
            alert("Generation complete! Check the Manual tab to review and publish.");
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
  }, [pollingDbId, pollStatusFn, manualForm]);

  return (
    <div className="container max-w-3xl py-12 lg:py-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="mr-2 h-4 w-4" />
          Share Your Expertise
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Submit a <span className="text-primary">Skill</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-[600px]">
          Contribute to the community by sharing your best prompts, workflows, and agent instructions.
        </p>
      </div>

      <Card className="border-primary/20 shadow-lg shadow-primary/5 bg-background/60 backdrop-blur-xl">
        <Tabs defaultValue="manual" className="w-full">
          <CardHeader>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="ai">Generate with AI</TabsTrigger>
            </TabsList>
            <CardDescription className="pt-4">
              Choose how you want to create your skill. You can write it from scratch or let our LangGraph agent build it for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            <TabsContent value="manual">
              <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Skill Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Next.js 15 Expert Assistant" 
                    {...manualForm.register("title")}
                    className="bg-background/50"
                  />
                  {manualForm.formState.errors.title && <p className="text-sm text-destructive">{manualForm.formState.errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Briefly describe what this skill accomplishes..." 
                    {...manualForm.register("description")}
                    className="resize-none bg-background/50"
                    rows={2}
                  />
                  {manualForm.formState.errors.description && <p className="text-sm text-destructive">{manualForm.formState.errors.description.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Prompt Content / Instructions</Label>
                  <Textarea 
                    id="content" 
                    placeholder="Paste the full prompt, context, or instructions here..." 
                    {...manualForm.register("content")}
                    className="min-h-[200px] font-mono text-sm bg-background/50"
                  />
                  {manualForm.formState.errors.content && <p className="text-sm text-destructive">{manualForm.formState.errors.content.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagsString">Tags (Comma separated)</Label>
                  <Input 
                    id="tagsString" 
                    placeholder="react, tailwind, ui" 
                    {...manualForm.register("tagsString")}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Add up to 5 tags.</p>
                  {manualForm.formState.errors.tagsString && <p className="text-sm text-destructive">{manualForm.formState.errors.tagsString.message}</p>}
                </div>

                {serverError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {serverError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={manualForm.formState.isSubmitting}>
                  {manualForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Skill'
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="ai">
              <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-6">
                <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg text-sm text-foreground/80 mb-6 flex gap-3">
                  <Bot className="h-5 w-5 text-primary flex-shrink-0" />
                  <div>
                    Provide a URL to documentation or an API, and tell the agent what kind of skill you want to generate. The agent will read the site and write the instructions for you.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Target URL</Label>
                  <Input 
                    id="url" 
                    placeholder="https://example.com/docs" 
                    {...aiForm.register("url")}
                    className="bg-background/50"
                  />
                  {aiForm.formState.errors.url && <p className="text-sm text-destructive">{aiForm.formState.errors.url.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">AI Prompt</Label>
                  <Textarea 
                    id="prompt" 
                    placeholder="Create a skill that uses this API to..." 
                    {...aiForm.register("prompt")}
                    className="resize-none bg-background/50 min-h-[120px]"
                  />
                  {aiForm.formState.errors.prompt && <p className="text-sm text-destructive">{aiForm.formState.errors.prompt.message}</p>}
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="include_mcp" className="rounded border-gray-300 text-primary focus:ring-primary" {...aiForm.register("include_mcp")} />
                  <Label htmlFor="include_mcp" className="font-normal">Include MCP server configuration (Advanced)</Label>
                </div>

                {serverError && !isGenerating && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                    {serverError}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {generationStatus}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Skill
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
