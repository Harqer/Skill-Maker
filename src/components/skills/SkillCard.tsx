import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { ThumbsUp } from 'lucide-react'

interface SkillCardProps {
  id: string
  title: string
  description: string
  tags?: string[]
  authorName?: string
  upvotes?: number
  imageUrl?: string
}

export default function SkillCard({ id, title, description, tags = [], authorName, upvotes = 0, imageUrl }: SkillCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full bg-secondary/30 backdrop-blur-md border border-white/5 hover:border-primary/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-background/50">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      )}
      <CardHeader className="flex-1 relative z-10">
        <div className="flex justify-between items-start gap-3">
          <CardTitle className="line-clamp-1 text-xl font-bold tracking-tight group-hover:text-primary transition-colors duration-300">{title}</CardTitle>
          <div className="flex items-center gap-1.5 text-sm text-foreground bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full shadow-inner">
            <ThumbsUp className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold text-xs">{upvotes}</span>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-3 text-muted-foreground leading-relaxed">{description}</CardDescription>
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-5">
            {tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold text-foreground/80 border border-white/10 group-hover:border-primary/30 transition-colors duration-300">
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
      
      <CardContent className="pb-5 relative z-10">
        <div className="flex items-center text-sm text-muted-foreground font-medium">
          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-2 border border-primary/30">
            <span className="text-[10px] text-primary font-bold">{(authorName || 'A')[0].toUpperCase()}</span>
          </div>
          <span>{authorName || 'Anonymous'}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0 relative z-10 pb-6 px-6">
        <Link to={`/skills/${id}`} className="w-full">
          <Button className="w-full bg-white/5 hover:bg-primary text-foreground hover:text-primary-foreground border border-white/10 hover:border-primary transition-all duration-300 shadow-sm">View Skill</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
