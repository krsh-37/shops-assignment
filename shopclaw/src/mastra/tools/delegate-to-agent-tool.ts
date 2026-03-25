import { createTool } from '@mastra/core/tools';
import { delegateToAgentInputSchema, delegateToAgentOutputSchema } from '../domain/openclaw/schemas.js';

export const delegateToAgentTool = createTool({
  id: 'openclaw-delegate-to-agent-tool',
  description: 'Record an orchestration-time delegation to a specialist agent.',
  inputSchema: delegateToAgentInputSchema,
  outputSchema: delegateToAgentOutputSchema,
  execute: async ({ agentId, task }) => ({
    delegated: true,
    agentId,
    task,
  }),
});
