import { createTool } from '@mastra/core/tools';
import { mem0 } from '../memory/mem0.js';
import { writeMem0InputSchema, writeMem0OutputSchema } from '../domain/openclaw/schemas.js';

export const mem0WriteTool = createTool({
  id: 'openclaw-mem0-write-tool',
  description: 'Write a structured section into shared OpenClaw memory.',
  inputSchema: writeMem0InputSchema,
  outputSchema: writeMem0OutputSchema,
  execute: async ({ launchId, section, value, agent, action }) => {
    const run = await mem0.writeSection(launchId, section as any, value as any, agent, action);
    return {
      launchId,
      section,
      updatedAt: run.updatedAt,
    };
  },
});
