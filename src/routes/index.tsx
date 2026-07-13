import { createFileRoute, Link } from '@tanstack/react-router'
import SkillCard from '@/components/skills/SkillCard'
import { Button } from '@/components/ui/button'
import { getSkills } from '@/server/skills'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'Skill Maker - AI Agent Marketplace' },
      { name: 'description', content: 'Discover, share, and deploy specialized skills for your autonomous AI agents.' }
    ]
  }),
  loader: async () => {
    // Fetch a few skills for the landing page
    return {
      trendingSkills: await getSkills({ data: undefined })
    }
  },
  component: Home,
})

function Home() {
  const { trendingSkills } = Route.useLoaderData()

  return (
    <div className="relative isolate min-h-screen">
      {/* Background glowing effects */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="container py-10 animate-in fade-in duration-700">
        <section className="mx-auto flex max-w-[980px] flex-col items-center gap-6 py-12 md:py-20 lg:py-32">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-foreground backdrop-blur-md mb-4 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Agent capabilities powered by LangGraph
          </div>
          <h1 className="text-center text-4xl font-extrabold leading-tight tracking-tighter md:text-6xl lg:text-7xl lg:leading-[1.1]">
            Unleash the full power of your <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Autonomous AI Agents</span>
          </h1>
          <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl font-medium mt-2">
            The definitive marketplace for AI skills. Discover, generate, and share specialized workflows for your autonomous systems.
          </p>
          <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-10 mt-6">
            <Link to="/explore">
              <Button size="lg" className="rounded-full px-8 h-12 text-md shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300">Explore Marketplace</Button>
            </Link>
            <Link to="/submit">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-md bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">Generate Skill</Button>
            </Link>
          </div>
        </section>

        <section className="py-12 md:py-24 relative z-10 border-t border-white/5 mt-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Trending Skills</h2>
              <p className="text-muted-foreground mt-2 text-md">The most popular workflows deployed this week.</p>
            </div>
            <Link to="/explore">
              <Button variant="ghost" className="hover:bg-white/5">View all collection &rarr;</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingSkills.slice(0, 3).map((skill) => (
              <SkillCard 
                key={skill.id} 
                id={skill.id}
                title={skill.title}
                description={skill.description}
                authorName={skill.authorId}
                tags={skill.tags}
                upvotes={skill.upvotes}
              />
            ))}
          </div>
        </section>
      </div>
      
      {/* Bottom glowing effects */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
    </div>
  )
}
