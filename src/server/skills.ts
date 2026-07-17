import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { z } from 'zod'
import { db } from '../lib/db'
import { skills, users } from '../lib/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export const submitSkillSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  content: z.string().min(20, 'Prompt content must be at least 20 characters'),
  tags: z.array(z.string()).min(1, 'Add at least one tag').max(5, 'Maximum 5 tags allowed'),
})

// ── Auth helper ───────────────────────────────────────────────────────────────
// Throws 401-shaped error when the user isn't signed in.
async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized: you must be signed in to perform this action.')
  }
  return userId
}

// ── Upsert the Clerk user into Neon `users` table ────────────────────────────
// Clerk is the source of truth; we sync on first action. No passwords stored.
async function ensureUserExists(userId: string) {
  // We only have the userId here; full profile data comes via the Clerk webhook
  // (which syncs email/name into SQLite on the backend). For the Neon DB we
  // just need the FK to exist — we'll backfill email later via webhook.
  try {
    await db
      .insert(users)
      .values({ id: userId, email: `${userId}@clerk.user` })
      .onConflictDoNothing()
  } catch {
    // Row already exists — safe to ignore
  }
}

// ── createSkill ───────────────────────────────────────────────────────────────
export const createSkill = createServerFn({ method: 'POST' })
  .validator(submitSkillSchema)
  .handler(async ({ data }) => {
    const userId = await requireAuth()
    await ensureUserExists(userId)

    const [inserted] = await db
      .insert(skills)
      .values({
        title: data.title,
        description: data.description,
        content: data.content,
        tags: data.tags,
        authorId: userId,
        upvotes: 0,
      })
      .returning({ id: skills.id })

    return { success: true, skillId: inserted.id }
  })

// ── getSkills ─────────────────────────────────────────────────────────────────
// Public — no auth required. Community library is world-readable.
export const getSkills = createServerFn({ method: 'GET' })
  .validator((data: { search?: string; tag?: string } | void) => data)
  .handler(async ({ data }) => {
    const allSkills = await db
      .select()
      .from(skills)
      .orderBy(desc(skills.createdAt))

    let results = allSkills
    if (data?.search) {
      const q = data.search.toLowerCase()
      results = results.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q),
      )
    }
    if (data?.tag) {
      results = results.filter((s) => s.tags.includes(data.tag!))
    }

    return results
  })

// ── getSkillById ──────────────────────────────────────────────────────────────
// Public — skill detail pages are world-readable.
export const getSkillById = createServerFn({ method: 'GET' })
  .validator((skillId: string) => skillId)
  .handler(async ({ data }) => {
    const result = await db
      .select()
      .from(skills)
      .where(eq(skills.id, data))
      .limit(1)

    const skill = result[0]
    if (!skill) throw new Error('Skill not found')

    return skill
  })

// ── upvoteSkill ───────────────────────────────────────────────────────────────
// Auth-gated — only signed-in users can upvote.
export const upvoteSkill = createServerFn({ method: 'POST' })
  .validator((skillId: string) => skillId)
  .handler(async ({ data }) => {
    await requireAuth()

    // Atomic increment — no read-then-write race condition
    await db
      .update(skills)
      .set({ upvotes: sql`${skills.upvotes} + 1` })
      .where(eq(skills.id, data))

    return { success: true }
  })

// ── evaluateSkill ─────────────────────────────────────────────────────────────
// Auth-gated — forwards request to FastAPI with the Clerk session token.
export const evaluateSkill = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      prompt: z.string(),
      skill_content: z.string(),
      assertions: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    const { getToken } = await auth()
    const token = await getToken()
    if (!token) throw new Error('Unauthorized')

    const response = await fetch('http://127.0.0.1:8000/api/evaluate_skill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Evaluation failed on backend')
    }
    return response.json()
  })
