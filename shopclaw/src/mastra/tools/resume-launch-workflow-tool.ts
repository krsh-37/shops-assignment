import { createTool } from '@mastra/core/tools';
import { resumeLaunch } from '../services/openclaw-launch-service.js';
import { resumeWorkflowInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';

export const resumeLaunchWorkflowTool = createTool({
  id: 'openclaw-resume-launch-workflow-tool',
  description: 'Submit the clarification answers for an awaiting launch and immediately start the workflow.',
  inputSchema: resumeWorkflowInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ launchId, answers }) => {
    const run = await resumeLaunch(launchId, answers);
    return {
      launchId: run.id,
      status: run.status,
      phase: run.phase,
      pending_questions: run.pendingQuestions,
      answers,
      next_action: 'workflow-running',
    };
  },
});
