import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildShopify } from '../domain/openclaw/content.js';
import { openClawMemorySchema, shopifyMemorySchema } from '../domain/openclaw/schemas.js';

const shopifyToolMemorySchema = openClawMemorySchema.pick({
  idea: true,
  brief: true,
  research: true,
  visual: true,
  gtm: true,
  audit_log: true,
});

export const shopifyAssetsTool = createTool({
  id: 'openclaw-shopify-assets-tool',
  description: 'Generate Shopify theme and merchandising payloads from prior memory.',
  inputSchema: z.object({
    memory: shopifyToolMemorySchema,
  }),
  outputSchema: shopifyMemorySchema,
  execute: async ({ memory }) => buildShopify(memory),
});
