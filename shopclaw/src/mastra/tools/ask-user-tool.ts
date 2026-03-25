import { createTool } from '@mastra/core/tools';
import { askUserInputSchema, askUserOutputSchema } from '../domain/openclaw/schemas.js';

export const askUserTool = createTool({
  id: 'openclaw-ask-user-tool',
  description: 'Return a batched clarification request for the user.',
  inputSchema: askUserInputSchema,
  outputSchema: askUserOutputSchema,
  execute: async ({ launchId, questions }) => ({
    launchId,
    status: 'awaiting-user-input' as const,
    questions,
  }),
});
