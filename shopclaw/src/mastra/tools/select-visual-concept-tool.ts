import { createTool } from '@mastra/core/tools';
import { getLaunchStatus, selectVisualConcept } from '../services/openclaw-launch-service.js';
import { visualSelectionInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';
import { getThreadIdFromToolContext } from './_thread-context.js';

export const selectVisualConceptTool = createTool({
  id: 'openclaw-select-visual-concept-tool',
  description:
    'Submit the founder visual concept choice and continue the launch workflow. If launchId is omitted, resolve the active visual-selection run automatically when unambiguous.',
  inputSchema: visualSelectionInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ launchId, conceptIndex }, context) => {
    const threadId = getThreadIdFromToolContext(context);
    const run = await selectVisualConcept(launchId, conceptIndex, threadId);
    return getLaunchStatus(run.id, threadId);
  },
});
