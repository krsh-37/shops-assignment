import { createTool } from '@mastra/core/tools';
import { getLaunchRun } from '../services/openclaw-launch-service.js';
import { resumeWorkflowInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';

export const resumeLaunchWorkflowTool = createTool({
  id: 'openclaw-resume-launch-workflow-tool',
  description: 'Return the current state for a paused or in-progress launch workflow.',
  inputSchema: resumeWorkflowInputSchema,
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
