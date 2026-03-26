import { createTool } from '@mastra/core/tools';
import { mem0 } from '../memory/mem0.js';
import { readMem0InputSchema, readMem0OutputSchema } from '../domain/openclaw/schemas.js';

export const mem0ReadTool = createTool({
  id: 'openclaw-mem0-read-tool',
  description: 'Read shared OpenClaw memory for a launch, optionally scoped to a section.',
  inputSchema: readMem0InputSchema,
  outputSchema: readMem0OutputSchema,
  execute: async ({ launchId, section }) => {
    if (section) {
      return {
        launchId,
        memory: (await mem0.hydrateSharedSection(launchId, section as any) as any) ?? null,
      };
    }

    return {
      launchId,
      full_memory: await mem0.hydrateSharedMemory(launchId),
    };
  },
});
