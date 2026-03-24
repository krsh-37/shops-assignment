import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildVisualDirection } from '../domain/openclaw/content.js';
import { openClawMemorySchema, visualMemorySchema } from '../domain/openclaw/schemas.js';

export const visualDirectionTool = createTool({
  id: 'openclaw-visual-direction-tool',
  description: 'Generate brand name selection, logo prompts, and palette outputs.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: visualMemorySchema,
  execute: async ({ memory }) => buildVisualDirection(memory),
});
