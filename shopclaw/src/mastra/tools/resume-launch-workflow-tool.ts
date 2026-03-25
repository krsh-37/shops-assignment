import { createTool } from '@mastra/core/tools';
import { resumeLaunch } from '../services/openclaw-launch-service.js';
import { resumeWorkflowInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';

export const resumeLaunchWorkflowTool = createTool({
  id: 'openclaw-resume-launch-workflow-tool',
  description: 'Resume a paused launch workflow with the user clarification answers.',
  inputSchema: resumeWorkflowInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ launchId, answers }) => {
    const run = resumeLaunch(launchId, answers);
    return {
      launchId: run.id,
      status: run.status,
      pending_questions: run.pendingQuestions,
      answers: run.clarificationAnswers,
    };
  },
});
