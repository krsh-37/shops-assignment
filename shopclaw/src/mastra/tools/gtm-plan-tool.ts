import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildGTM } from '../domain/openclaw/content.js';
import { gtmMemorySchema, openClawMemorySchema } from '../domain/openclaw/schemas.js';

const gtmToolMemorySchema = openClawMemorySchema.pick({
  idea: true,
  brief: true,
  research: true,
  visual: true,
  domains: true,
  audit_log: true,
});

export const gtmPlanTool = createTool({
  id: 'openclaw-gtm-plan-tool',
  description: 'Generate an India-first GTM plan from shared memory.',
  inputSchema: z.object({
    memory: gtmToolMemorySchema,
  }),
  outputSchema: gtmMemorySchema,
  execute: async ({ memory }) => buildGTM(memory),
});
