import { createTool } from '@mastra/core/tools';
import { delegateToAgentInputSchema, delegateToAgentOutputSchema } from '../domain/openclaw/schemas.js';
import { mem0 } from '../memory/mem0.js';

export const delegateToAgentTool = createTool({
  id: 'openclaw-delegate-to-agent-tool',
  description: 'Record an orchestration-time delegation to a specialist agent.',
  inputSchema: delegateToAgentInputSchema,
  outputSchema: delegateToAgentOutputSchema,
  execute: async ({ agentId, launchId, task }) => {
    const run = launchId ? mem0.recordDelegation(launchId, agentId, task) : null;

    return {
      delegated: true,
      agentId,
      task,
      launchId,
      status: run?.status,
    };
  },
});
