import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildLaunchBible } from '../domain/openclaw/content.js';
import { launchBibleSchema, openClawMemorySchema } from '../domain/openclaw/schemas.js';

export const launchReportTool = createTool({
  id: 'openclaw-launch-report-tool',
  description: 'Compile the final launch bible from the shared OpenClaw memory.',
  inputSchema: z.object({
    memory: openClawMemorySchema,
  }),
  outputSchema: launchBibleSchema,
  execute: async ({ memory }) => buildLaunchBible(memory),
});
