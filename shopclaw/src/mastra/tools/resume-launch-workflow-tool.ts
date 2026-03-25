import { createTool } from '@mastra/core/tools';
import { getLaunchStatus, resumeLaunch } from '../services/openclaw-launch-service.js';
import { resumeWorkflowInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';
import { getThreadIdFromToolContext } from './_thread-context.js';

export const resumeLaunchWorkflowTool = createTool({
  id: 'openclaw-resume-launch-workflow-tool',
  description:
    'Submit the clarification answers for an awaiting launch and immediately start the workflow. If launchId is omitted, resolve the active clarification run automatically when unambiguous.',
  inputSchema: resumeWorkflowInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ launchId, answers }, context) => {
    const threadId = getThreadIdFromToolContext(context);
    const run = await resumeLaunch(launchId, answers, threadId);
    return getLaunchStatus(run.id, threadId);
  },
});
