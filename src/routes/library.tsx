import { createFileRoute, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Brain, Layers, Cpu, Sparkles, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/library')({
  head: () => ({
    meta: [
      { title: 'Library - Skill Maker' },
      { name: 'description', content: 'Your personal collection of skills and subagents.' }
    ]
  }),
  component: LibraryPage,
})

// Mock data for personal skills/subagents
const personalAgents = [
  {
    id: '1',
    title: 'Code Reviewer Expert',
    description: 'An expert subagent configured to review code for security and performance.',
    icon: Brain,
    type: 'Subagent'
  },
  {
    id: '2',
    title: 'Web Scraper Pro',
    description: 'A skill designed to extract structured data from any given URL.',
    icon: Layers,
    type: 'Skill'
  },
  {
    id: '3',
    title: 'React Component Generator',
    description: 'Specialized agent for building Shadcn UI components from descriptions.',
    icon: Cpu,
    type: 'Subagent'
  },
  {
    id: '4',
    title: 'Data Analyst',
    description: 'Automatically visualizes and explains CSV data sets.',
    icon: Sparkles,
    type: 'Skill'
  }
]

function ArcGallery({ items }: { items: typeof personalAgents }) {
  const [isHovered, setIsHovered] = useState(false)

  // Calculate arc parameters
  const totalItems = items.length
  const maxRotation = 45 // max rotation angle for the outermost cards
  
  return (
    <div 
      className="relative flex items-center justify-center h-[500px] w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-center">
        {items.map((item, index) => {
          // Math for the arc
          const progress = index / (totalItems - 1 || 1) // 0 to 1
          const centeredProgress = progress - 0.5 // -0.5 to 0.5
          
          const targetRotation = centeredProgress * maxRotation
          const targetY = Math.abs(centeredProgress) * 50
          const targetX = centeredProgress * 300 // spread width
          
          // When NOT hovered: stacked slightly
          const stackedRotation = centeredProgress * 10
          const stackedY = index * 4
          const stackedX = centeredProgress * 40
          const zIndex = totalItems - Math.abs(centeredProgress * 10)

          return (
            <motion.div
              key={item.id}
              className="absolute origin-bottom"
              style={{ zIndex: Math.floor(zIndex) }}
              initial={false}
              animate={{
                rotate: isHovered ? targetRotation : stackedRotation,
                y: isHovered ? targetY : stackedY,
                x: isHovered ? targetX : stackedX,
                scale: isHovered ? 1 : 1 - Math.abs(centeredProgress) * 0.05,
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              whileHover={{ 
                scale: 1.05, 
                y: targetY - 20, 
                zIndex: 100,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="w-64 h-[22rem] shadow-xl border-border bg-card hover:border-primary/50 transition-colors group overflow-hidden flex flex-col">
                <Link to={`/skills/${item.id}`} className="flex-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1 font-sans">
                      {item.type}
                    </div>
                    <CardTitle className="leading-tight font-serif">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm line-clamp-4 font-sans text-muted-foreground">
                      {item.description}
                    </CardDescription>
                  </CardContent>
                </Link>
                <CardFooter className="mt-auto border-t border-border pt-4 bg-muted/20">
                  <Link to="/benchmarks" search={{ skillId: item.id }} className="w-full">
                    <Button variant="outline" className="w-full bg-background border-border hover:bg-primary hover:text-white transition-colors">
                      <Activity className="w-4 h-4 mr-2" />
                      Benchmark
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </div>
      
      {!isHovered && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-10 px-4 py-2 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium text-muted-foreground border border-border shadow-sm pointer-events-none font-sans"
        >
          Hover to expand your collection
        </motion.div>
      )}
    </div>
  )
}

function LibraryPage() {
  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 min-h-full">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3 font-serif">
          <Layers className="h-8 w-8 text-primary" />
          Library & Collection
        </h1>
        <p className="text-muted-foreground font-sans">Manage your personal skills and curated subagents.</p>
      </div>

      <div className="bg-muted/10 rounded-2xl border border-border overflow-hidden">
        <ArcGallery items={personalAgents} />
      </div>
    </div>
  )
}
