import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildGTM } from '../domain/openclaw/content.js';
import { gtmMemorySchema, openClawMemorySchema } from '../domain/openclaw/schemas.js';

export const gtmPlanTool = createTool({
  id: 'openclaw-gtm-plan-tool',
  description: 'Generate an India-first GTM plan from shared memory.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: gtmMemorySchema,
  execute: async ({ memory }) => buildGTM(memory),
});
