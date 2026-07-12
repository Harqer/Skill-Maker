import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SkillCardProps {
  title: string
  description: string
  imageUrl?: string
  author: string
}

export function SkillCard({ title, description, imageUrl, author }: SkillCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {imageUrl && (
        <div className="aspect-video w-full overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="line-clamp-1">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center text-sm text-muted-foreground">
          <span>By {author}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full">View Skill</Button>
      </CardFooter>
    </Card>
  )
}
