import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildShopify } from '../domain/openclaw/content.js';
import { openClawMemorySchema, shopifyMemorySchema } from '../domain/openclaw/schemas.js';

export const shopifyAssetsTool = createTool({
  id: 'openclaw-shopify-assets-tool',
  description: 'Generate Shopify theme and merchandising payloads from prior memory.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: shopifyMemorySchema,
  execute: async ({ memory }) => buildShopify(memory),
});
