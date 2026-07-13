import { createFileRoute } from '@tanstack/react-router'
import { getSkillById } from '../server/skills'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { ArrowLeft, Copy, Check, ThumbsUp } from 'lucide-react'
import { useState } from 'react'

export const Route = createFileRoute('/skills/$skillId')({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.skill ? `${loaderData.skill.title} - Skill Maker` : 'Skill Details - Skill Maker' },
      { name: 'description', content: loaderData?.skill ? loaderData.skill.description : 'View details of this skill.' }
    ]
  }),
  loader: async ({ params }) => {
    return {
      skill: await getSkillById({ data: params.skillId })
    }
  },
  component: SkillDetailPage,
  errorComponent: () => <div className="container py-24 text-center">Skill not found!</div>
})

function SkillDetailPage() {
  const { skill } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(skill.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative isolate min-h-screen">
      {/* Background glowing effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="container max-w-4xl py-12 animate-in fade-in duration-500 relative z-10">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-8 -ml-4 text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Explore
        </Button>

        <Card className="border border-white/10 bg-secondary/30 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <CardHeader className="space-y-6 pb-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div>
                <CardTitle className="text-4xl font-extrabold tracking-tight text-foreground">{skill.title}</CardTitle>
                <CardDescription className="text-lg mt-4 text-muted-foreground leading-relaxed max-w-[800px]">{skill.description}</CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2 h-10 px-4 bg-primary/10 border-primary/20 hover:bg-primary hover:text-white text-primary transition-all">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="font-bold">{skill.upvotes}</span>
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 pt-2">
              {skill.tags.map(tag => (
                <span key={tag} className="inline-flex items-center rounded-md bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <div className="relative group rounded-xl border border-white/10 bg-black/40 p-6 font-mono text-sm shadow-inner">
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 border-0"
                onClick={handleCopy}
              >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-foreground/70" />}
              </Button>
              <pre className="whitespace-pre-wrap overflow-x-auto text-foreground/90 leading-relaxed font-medium">
                {skill.content}
              </pre>
            </div>
          </CardContent>
          
          <CardFooter className="text-sm font-medium text-muted-foreground pt-6 pb-8 px-6 border-t border-white/5 relative z-10 bg-white/[0.02]">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 border border-primary/30">
                <span className="text-xs text-primary font-bold">{(skill.authorId || 'A')[0].toUpperCase()}</span>
              </div>
              Created by <span className="text-foreground ml-1 mr-2">{skill.authorId}</span> • {new Date(skill.createdAt).toLocaleDateString()}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
