import { createFileRoute } from '@tanstack/react-router'
import { getSkills } from '../server/skills'
import SkillCard from '../components/skills/SkillCard'
import { Input } from '../components/ui/input'
import { Search } from 'lucide-react'

// Validate search params for filtering
export const Route = createFileRoute('/explore')({
  head: () => ({
    meta: [
      { title: 'Explore Skills - Skill Maker' },
      { name: 'description', content: 'Discover the best prompts and agent workflows from the community.' }
    ]
  }),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || '',
      tag: (search.tag as string) || '',
    }
  },
  loaderDeps: ({ search: { q, tag } }) => ({ q, tag }),
  loader: async ({ deps: { q, tag } }) => {
    // In a real app with streaming, you could return an unawaited promise here 
    // or use defer(), but for now we'll await it for simplicity.
    const skillsPromise = getSkills({ data: { search: q, tag } })
    return {
      skills: await skillsPromise,
    }
  },
  component: ExplorePage,
})

function ExplorePage() {
  const { skills } = Route.useLoaderData()
  const { q, tag } = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const query = formData.get('q') as string
    
    navigate({
      search: (prev) => ({
        ...prev,
        q: query || undefined
      })
    })
  }

  return (
    <div className="relative isolate min-h-screen bg-background">
      <div className="container py-12 animate-in fade-in duration-500 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-border/50 pb-6">
          <div>
            <h1 className="text-4xl font-bold font-serif text-foreground tracking-tight">Explore Skills</h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">Discover the best prompts and agent workflows from the community.</p>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full md:w-auto md:min-w-[350px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              name="q"
              defaultValue={q}
              placeholder="Search skills by name or keyword..." 
              className="pl-12 h-12 rounded-full bg-secondary/30 backdrop-blur-md border-white/10 focus-visible:ring-primary focus-visible:border-primary shadow-[0_0_15px_rgba(255,255,255,0.05)] text-md"
            />
          </form>
        </div>

        {tag && (
          <div className="mb-8 flex items-center gap-3 bg-secondary/30 backdrop-blur-md border border-white/10 p-4 rounded-xl inline-flex shadow-sm">
            <span className="text-sm text-muted-foreground font-medium">Filtering by tag:</span>
            <span className="inline-flex items-center rounded-md bg-primary/20 px-3 py-1 text-sm font-bold text-primary border border-primary/30">
              {tag}
            </span>
            <button 
              onClick={() => navigate({ search: (prev) => ({ ...prev, tag: undefined }) })}
              className="text-sm text-muted-foreground hover:text-white transition-colors ml-2 font-medium"
            >
              &times; Clear filter
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skills.map(skill => (
            <SkillCard 
              key={skill.id}
              id={skill.id}
              title={skill.title}
              description={skill.description}
              content={skill.content}
              tags={skill.tags}
              upvotes={skill.upvotes}
              authorName={skill.authorId} // Would normally join with User table
            />
          ))}
          {skills.length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/50 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground">No skills found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filtering by a different tag.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
