import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

const FASTAPI_URL = 'http://127.0.0.1:8000';

export const generateSkillFromUrl = createServerFn({ method: 'POST' })
  .validator(z.object({
    url: z.string().url('Must be a valid URL'),
    prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
    include_mcp: z.boolean().default(false)
  }))
  .handler(async ({ data }) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/api/generate_skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error("Failed to trigger skill generation");
      }
      return await response.json();
    } catch (e: any) {
      throw new Error("Error connecting to AI Agent: " + e.message);
    }
  })

export const getGenerationStatus = createServerFn({ method: 'GET' })
  .validator((dbId: number) => dbId)
  .handler(async ({ data }) => {
    try {
      const response = await fetch(`${FASTAPI_URL}/api/skill_request/${data}`);
      if (!response.ok) {
        throw new Error("Failed to get status");
      }
      return await response.json();
    } catch (e: any) {
      throw new Error("Error connecting to AI Agent: " + e.message);
    }
  })
