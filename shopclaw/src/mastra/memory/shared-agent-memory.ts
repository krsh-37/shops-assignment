import { Memory } from '@mastra/memory';

export const sharedAgentMemory = new Memory({
  options: {
    lastMessages: 20,
    generateTitle: true,
    workingMemory: {
      enabled: true,
      scope: 'resource',
    },
  },
});
