import { createTool } from '@mastra/core/tools';
import { startLaunch } from '../services/openclaw-launch-service.js';
import { startWorkflowInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';

export const startLaunchWorkflowTool = createTool({
  id: 'openclaw-start-launch-workflow-tool',
  description: 'Start the OpenClaw launch workflow for a founder idea.',
  inputSchema: startWorkflowInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ idea }) => {
    const run = startLaunch(idea);
    return {
      launchId: run.id,
      status: run.status,
    };
  },
});
