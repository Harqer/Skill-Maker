import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../lib/db'
import { skills, users } from '../lib/db/schema'
import { eq, desc } from 'drizzle-orm'
// In a real app with Clerk + TanStack Start, you'd use getAuth(request) from @clerk/tanstack-start/server

export const submitSkillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  content: z.string().min(20, 'Prompt content must be at least 20 characters'),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(5, 'Maximum 5 tags allowed'),
})

// Simulated Clerk Auth Middleware for Server Functions
const authMiddleware = createServerFn({ method: 'GET' }).validator((_data: void) => {}).handler(async ({ request }) => {
  // Mock auth check
  const isAuth = true; // Replace with real Clerk check
  if (!isAuth) {
    throw new Error("Unauthorized")
  }
  return { userId: "user_mock123" }
})

export const createSkill = createServerFn({ method: 'POST' })
  .validator(submitSkillSchema)
  .handler(async ({ data }) => {
    // 1. In a real app we'd verify auth here
    const userId = "user_mock123";

    // Ensure the mock user exists in the DB first (for development since we have a foreign key constraint)
    try {
      await db.insert(users).values({ id: userId, email: "mock@example.com" }).onConflictDoNothing();
    } catch(e) {}

    // 2. Insert into Neon DB
    const [inserted] = await db.insert(skills).values({
      title: data.title,
      description: data.description,
      content: data.content,
      tags: data.tags,
      authorId: userId,
      upvotes: 0
    }).returning({ id: skills.id });
    
    return { success: true, skillId: inserted.id }
  })

export const getSkills = createServerFn({ method: 'GET' })
  .validator((data: { search?: string, tag?: string } | void) => data)
  .handler(async ({ data }) => {
    // 1. Fetch from Neon database using Drizzle
    const allSkills = await db.select().from(skills).orderBy(desc(skills.createdAt));
    
    // Simple mock logic for filtering if necessary
    let results = allSkills;
    if (data?.search) {
      results = results.filter(s => s.title.toLowerCase().includes(data.search!.toLowerCase()) || s.description.toLowerCase().includes(data.search!.toLowerCase()));
    }
    if (data?.tag) {
      results = results.filter(s => s.tags.includes(data.tag!));
    }
    
    return results;
  })

export const getSkillById = createServerFn({ method: 'GET' })
  .validator((skillId: string) => skillId)
  .handler(async ({ data }) => {
    // 1. Fetch the specific skill from Neon Database
    const result = await db.select().from(skills).where(eq(skills.id, data)).limit(1);
    
    const skill = result[0];
    if (!skill) {
      throw new Error("Skill not found")
    }
    
    return skill;
  })

export const evaluateSkill = createServerFn({ method: 'POST' })
  .validator(z.object({
    prompt: z.string(),
    skill_content: z.string(),
    assertions: z.array(z.string())
  }))
  .handler(async ({ data }) => {
    // Call the Python FastAPI backend
    try {
      const response = await fetch("http://127.0.0.1:8000/api/evaluate_skill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error("Evaluation failed on backend");
      }
      return await response.json();
    } catch (e: any) {
      throw new Error("Error evaluating skill: " + e.message);
    }
  })
