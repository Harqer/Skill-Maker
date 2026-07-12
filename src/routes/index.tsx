import { createFileRoute } from '@tanstack/react-router'
import { SkillCard } from '@/components/skills/SkillCard'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const dummySkills = [
    {
      id: 1,
      title: 'Auto-Blogger Agent',
      description: 'An autonomous agent that researches trending topics and writes compelling blog posts with SEO optimization.',
      author: 'AI Enthusiast',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      id: 2,
      title: 'Code Reviewer Pro',
      description: 'Automatically reviews your pull requests for security vulnerabilities, style guide adherence, and potential bugs.',
      author: 'DevOps Master',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800&h=450'
    },
    {
      id: 3,
      title: 'Social Media Manager',
      description: 'Schedules, generates, and posts content across multiple platforms while engaging with comments autonomously.',
      author: 'Marketing Guru',
      imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800&h=450'
    }
  ]

  return (
    <div className="container py-10">
      <section className="mx-auto flex max-w-[980px] flex-col items-center gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
        <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
          Discover & Share AI Skills
        </h1>
        <p className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
          The marketplace for autonomous agent capabilities. Build, share, and deploy specialized skills for your AI agents.
        </p>
        <div className="flex w-full items-center justify-center space-x-4 py-4 md:pb-10">
          <Button size="lg">Explore Skills</Button>
          <Button size="lg" variant="outline">Create Skill</Button>
        </div>
      </section>

      <section className="py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Trending Skills</h2>
          <Button variant="ghost">View all</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dummySkills.map((skill) => (
            <SkillCard key={skill.id} {...skill} />
          ))}
        </div>
      </section>
    </div>
  )
}
