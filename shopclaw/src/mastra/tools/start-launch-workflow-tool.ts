import { createTool } from '@mastra/core/tools';
import { startLaunch } from '../services/openclaw-launch-service.js';
import { startWorkflowInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';

export const startLaunchWorkflowTool = createTool({
  id: 'openclaw-start-launch-workflow-tool',
  description: 'Create a draft launch, generate the upfront clarification batch, and return the pending questions. This does not start the workflow yet.',
  inputSchema: startWorkflowInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ idea }) => {
    const run = await startLaunch(idea);
    return {
      launchId: run.id,
      status: run.status,
      phase: run.phase,
      pending_questions: run.pendingQuestions,
      next_action: 'answer-clarifications',
    };
  },
});
