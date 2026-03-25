import { createTool } from '@mastra/core/tools';
import { askUserInputSchema, askUserOutputSchema } from '../domain/openclaw/schemas.js';
import { mem0 } from '../memory/mem0.js';

export const askUserTool = createTool({
  id: 'openclaw-ask-user-tool',
  description: 'Return a batched clarification request for the user.',
  inputSchema: askUserInputSchema,
  outputSchema: askUserOutputSchema,
  execute: async ({ launchId, questions, reason }) => {
    if (launchId) {
      mem0.requestHumanInput(launchId, questions, reason);
    }

    return {
      launchId,
      status: 'awaiting-user-input' as const,
      questions,
      reason,
    };
  },
});
