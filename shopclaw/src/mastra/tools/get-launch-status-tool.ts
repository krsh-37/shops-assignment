import { createTool } from '@mastra/core/tools';
import { getLaunchRun } from '../services/openclaw-launch-service.js';
import { launchTokenSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';

export const getLaunchStatusTool = createTool({
  id: 'openclaw-get-launch-status-tool',
  description: 'Get the current status for a launch workflow.',
  inputSchema: launchTokenSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ launchId }) => {
    const run = getLaunchRun(launchId);
    if (!run) {
      throw new Error(`Launch run ${launchId} was not found.`);
    }

    return {
      launchId: run.id,
      status: run.status,
    };
  },
});
