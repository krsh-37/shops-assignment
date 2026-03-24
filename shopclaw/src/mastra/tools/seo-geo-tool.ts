import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildSEO } from '../domain/openclaw/content.js';
import { openClawMemorySchema, seoMemorySchema } from '../domain/openclaw/schemas.js';

export const seoGeoTool = createTool({
  id: 'openclaw-seo-geo-tool',
  description: 'Generate SEO and GEO outputs from prior research and brand memory.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: seoMemorySchema,
  execute: async ({ memory }) => buildSEO(memory),
});
