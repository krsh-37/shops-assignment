import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildResearch } from '../domain/openclaw/content.js';
import { openClawMemorySchema, researchMemorySchema } from '../domain/openclaw/schemas.js';

export const researchTool = createTool({
  id: 'openclaw-research-tool',
  description: 'Generate a structured brand research report for the launch idea.',
  inputSchema: z.object({
    idea: z.string(),
    memory: openClawMemorySchema,
  }),
  outputSchema: researchMemorySchema,
  execute: async ({ idea, memory }) => buildResearch(idea, memory),
});
