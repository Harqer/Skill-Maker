import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createSkill } from '../server/skills'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Sparkles, Loader2, LogIn } from 'lucide-react'
import { useState } from 'react'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'

export const Route = createFileRoute('/submit')({
  head: () => ({
    meta: [
      { title: 'Submit a Skill - Zap' },
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

type ManualFormValues = z.infer<typeof manualFormSchema>

function SubmitPage() {
  const navigate = useNavigate()
  const submitFn = useServerFn(createSkill)
  const [serverError, setServerError] = useState<string | null>(null)
  
  const manualForm = useForm<ManualFormValues>({
    resolver: zodResolver(manualFormSchema),
    defaultValues: {
      title: '',
      description: '',
      content: '',
      tagsString: '',
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

  return (
    <div className="container max-w-3xl py-12 lg:py-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <SignedOut>
        <div className="flex flex-col items-center justify-center text-center gap-6 py-24">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <LogIn className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-serif text-foreground">Sign in to submit a skill</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create an account or sign in to share your expertise with the community.
            </p>
          </div>
          <SignInButton mode="modal">
            <Button className="rounded-full px-8">
              Sign in to continue
            </Button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
      <div className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <Sparkles className="mr-2 h-4 w-4" />
          Share Your Expertise
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
          Submit a <span className="text-primary">Skill</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-[600px]">
          Contribute to the community by sharing your best prompts, workflows, and agent instructions.
        </p>
      </div>

      <Card className="border-border shadow-lg bg-card">
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>
            Write your skill instructions manually to share with the community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Skill Title</Label>
              <Input 
                id="title" 
                placeholder="e.g., Next.js 15 Expert Assistant" 
                {...manualForm.register("title")}
                className="bg-background border-border"
              />
              {manualForm.formState.errors.title && <p className="text-sm text-destructive">{manualForm.formState.errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea 
                id="description" 
                placeholder="Briefly describe what this skill accomplishes..." 
                {...manualForm.register("description")}
                className="resize-none bg-background border-border"
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
                className="min-h-[200px] font-mono text-sm bg-background border-border"
              />
              {manualForm.formState.errors.content && <p className="text-sm text-destructive">{manualForm.formState.errors.content.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagsString">Tags (Comma separated)</Label>
              <Input 
                id="tagsString" 
                placeholder="react, tailwind, ui" 
                {...manualForm.register("tagsString")}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">Add up to 5 tags.</p>
              {manualForm.formState.errors.tagsString && <p className="text-sm text-destructive">{manualForm.formState.errors.tagsString.message}</p>}
            </div>

            {serverError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full shadow-sm" disabled={manualForm.formState.isSubmitting}>
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
        </CardContent>
      </Card>
      </SignedIn>
    </div>
  )
}
