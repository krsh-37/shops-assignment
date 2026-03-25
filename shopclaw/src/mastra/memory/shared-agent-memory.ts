import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { getMastraStorageUrl, isDevMode } from '../config/openclaw-config.js';

export const sharedAgentMemory = new Memory({
  storage: new LibSQLStore({
    id: 'openclaw-agent-memory-storage',
    url: getMastraStorageUrl(),
  }),
  vector: isDevMode()
    ? new LibSQLVector({
        id: 'openclaw-agent-memory-vector',
        url: getMastraStorageUrl(),
      })
    : false,
  embedder: isDevMode() ? 'google/gemini-embedding-001' : undefined,
  options: {
    lastMessages: 20,
    generateTitle: true,
    semanticRecall: isDevMode()
      ? {
          topK: 3,
          messageRange: 2,
          scope: 'resource',
        }
      : false,
    workingMemory: {
      enabled: true,
      scope: 'resource',
    },
  },
});
