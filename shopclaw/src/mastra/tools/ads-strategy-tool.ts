import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildAds } from '../domain/openclaw/content.js';
import { adsMemorySchema, openClawMemorySchema } from '../domain/openclaw/schemas.js';

const adsToolMemorySchema = openClawMemorySchema.pick({
  idea: true,
  brief: true,
  research: true,
  visual: true,
  gtm: true,
  audit_log: true,
});

export const adsStrategyTool = createTool({
  id: 'openclaw-ads-strategy-tool',
  description: 'Generate paid media strategy, ad hooks, and campaign structures.',
  inputSchema: z.object({
    memory: adsToolMemorySchema,
  }),
  outputSchema: adsMemorySchema,
  execute: async ({ memory }) => buildAds(memory),
});
