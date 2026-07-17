import { createServerFn } from '@tanstack/react-start'
import { auth } from '@clerk/tanstack-react-start/server'
import { z } from 'zod'

const FASTAPI_URL = 'http://127.0.0.1:8000'

// ── Helper: get a fresh Clerk bearer token or throw ──────────────────────────
async function getBearerToken(): Promise<string> {
  const { userId, getToken } = await auth()
  if (!userId) {
    throw new Error('Unauthorized: you must be signed in to use the AI agent.')
  }
  const token = await getToken()
  if (!token) {
    throw new Error('Could not retrieve session token. Please sign in again.')
  }
  return token
}

// ── generateSkillFromUrl ──────────────────────────────────────────────────────
// Submits a URL to the FastAPI /api/generate_skill endpoint which enqueues an
// RQ job. The Clerk JWT is forwarded so FastAPI can verify the user.
export const generateSkillFromUrl = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      url: z.string().url('Must be a valid URL'),
      prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
      include_mcp: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const token = await getBearerToken()

    const response = await fetch(`${FASTAPI_URL}/api/generate_skill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Failed to trigger skill generation (${response.status}): ${body}`)
    }

    return response.json()
  })

// ── getGenerationStatus ───────────────────────────────────────────────────────
// Polls the FastAPI /api/skill_request/:db_id endpoint for job status.
// Auth required — users can only see their own jobs (enforced by FastAPI).
export const getGenerationStatus = createServerFn({ method: 'GET' })
  .validator((dbId: number) => dbId)
  .handler(async ({ data }) => {
    const token = await getBearerToken()

    const response = await fetch(`${FASTAPI_URL}/api/skill_request/${data}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get generation status (${response.status})`)
    }

    return response.json()
  })
