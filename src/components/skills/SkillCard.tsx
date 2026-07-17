import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ThumbsUp, Activity, FileText, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface SkillCardProps {
  id: string
  title: string
  description: string
  content?: string
  tags?: string[]
  authorName?: string
  upvotes?: number
  imageUrl?: string
}

export default function SkillCard({ id, title, description, content, tags = [], authorName, upvotes = 0, imageUrl }: SkillCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card className="relative overflow-hidden group hover:shadow-[0_0_30px_rgba(var(--color-primary),0.25)] transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full bg-card border border-border hover:border-primary/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted/50">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      )}
      <CardHeader className="flex-1 relative z-10 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="line-clamp-1 text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300 text-foreground">{title}</CardTitle>
          <div className="flex items-center gap-1.5 text-sm text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full shadow-inner shrink-0">
            <ThumbsUp className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-xs">{upvotes}</span>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-3 text-muted-foreground leading-relaxed">{description}</CardDescription>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-foreground/80 border border-border group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors duration-300">
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      
      {isExpanded && content && (
        <CardContent className="relative z-10 animate-in slide-in-from-top-2 duration-300">
          <div className="relative group/code rounded-md border border-border bg-black/5 p-4 font-mono text-xs shadow-inner max-h-64 overflow-y-auto">
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover/code:opacity-100 transition-opacity"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            </Button>
            <pre className="whitespace-pre-wrap text-foreground/80 leading-relaxed font-medium">
              {content}
            </pre>
          </div>
        </CardContent>
      )}

      <CardContent className="pb-5 relative z-10 pt-0">
        <div className="flex items-center text-sm text-muted-foreground font-medium">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center mr-2 border border-primary/20">
            <span className="text-[10px] text-primary font-bold">{(authorName || 'A')[0].toUpperCase()}</span>
          </div>
          <span>{authorName || 'Anonymous'}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 relative z-10 pb-6 px-6 gap-3 flex-col sm:flex-row">
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full sm:flex-1"
        >
          {isExpanded ? (
            <><ChevronUp className="h-4 w-4 mr-2" /> Collapse</>
          ) : (
            <><FileText className="h-4 w-4 mr-2" /> Read Skill</>
          )}
        </Button>
        <Link to="/benchmarks" search={{ skillId: id }} className="w-full sm:flex-1">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <Activity className="h-4 w-4 mr-2" />
            Benchmark
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
