import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildSEO } from '../domain/openclaw/content.js';
import { openClawMemorySchema, seoMemorySchema } from '../domain/openclaw/schemas.js';

const seoToolMemorySchema = openClawMemorySchema.pick({
  idea: true,
  brief: true,
  research: true,
  visual: true,
  shopify: true,
  ads: true,
  gtm: true,
  audit_log: true,
});

export const seoGeoTool = createTool({
  id: 'openclaw-seo-geo-tool',
  description: 'Generate SEO and GEO outputs from prior research and brand memory.',
  inputSchema: z.object({
    memory: seoToolMemorySchema,
  }),
  outputSchema: seoMemorySchema,
  execute: async ({ memory }) => buildSEO(memory),
});
