import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildVisualDirection } from '../domain/openclaw/content.js';
import { openClawMemorySchema, visualMemorySchema } from '../domain/openclaw/schemas.js';

const visualToolMemorySchema = openClawMemorySchema.pick({
  idea: true,
  brief: true,
  research: true,
  domains: true,
  audit_log: true,
});

export const visualDirectionTool = createTool({
  id: 'openclaw-visual-direction-tool',
  description: 'Generate brand name selection, logo prompts, and palette outputs.',
  inputSchema: z.object({
    memory: visualToolMemorySchema,
  }),
  outputSchema: visualMemorySchema,
  execute: async ({ memory }) => buildVisualDirection(memory),
});
