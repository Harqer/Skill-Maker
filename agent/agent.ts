import { createAgent } from 'eve';
import { z } from 'zod';

/**
 * Base configuration for the Zap Skill Generator Agent
 * This follows the Eve framework (filesystem-first approach)
 */
export const zapAgent = createAgent({
  name: "ZapGenerator",
  model: "google/gemini-2.0-flash",
  description: "An agent that generates structured skills/agents for other AI platforms.",
  instructions: "You are an expert AI agent creator. Follow the Eve structure for generating output.",
  tools: {
    // Scaffold basic tools that might be needed by the generator
    searchDocumentation: {
      description: "Search platform documentation",
      parameters: z.object({
        query: z.string()
      }),
      execute: async ({ query }) => {
        // Implementation here
        return "Not implemented";
      }
    }
  }
});
