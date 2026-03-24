import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildAds } from '../domain/openclaw/content.js';
import { adsMemorySchema, openClawMemorySchema } from '../domain/openclaw/schemas.js';

export const adsStrategyTool = createTool({
  id: 'openclaw-ads-strategy-tool',
  description: 'Generate paid media strategy, ad hooks, and campaign structures.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: adsMemorySchema,
  execute: async ({ memory }) => buildAds(memory),
});
