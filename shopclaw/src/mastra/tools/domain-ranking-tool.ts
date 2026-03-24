import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildDomainOptions } from '../domain/openclaw/content.js';
import { domainMemorySchema, openClawMemorySchema } from '../domain/openclaw/schemas.js';

export const domainRankingTool = createTool({
  id: 'openclaw-domain-ranking-tool',
  description: 'Generate and rank brand domains using deterministic availability stubs.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: domainMemorySchema,
  execute: async ({ memory }) => buildDomainOptions(memory),
});
