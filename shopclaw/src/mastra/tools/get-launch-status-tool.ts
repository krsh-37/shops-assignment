import { createTool } from '@mastra/core/tools';
import { getLaunchStatus } from '../services/openclaw-launch-service.js';
import { launchLookupInputSchema, workflowControlOutputSchema } from '../domain/openclaw/schemas.js';
import { getThreadIdFromToolContext } from './_thread-context.js';

export const getLaunchStatusTool = createTool({
  id: 'openclaw-get-launch-status-tool',
  description: 'Get the current status for a launch workflow. If launchId is omitted, resolve the active launch automatically when unambiguous.',
  inputSchema: launchLookupInputSchema,
  outputSchema: workflowControlOutputSchema,
  execute: async ({ launchId }, context) => getLaunchStatus(launchId, getThreadIdFromToolContext(context)),
});
