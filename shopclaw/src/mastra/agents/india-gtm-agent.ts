import { isDevMode } from '../config/openclaw-config.js';
import { gtmPlanTool } from '../tools/gtm-plan-tool.js';
import { createOpenClawAgent, defaultModel } from './_shared.js';

export const gtmAgent = createOpenClawAgent({
  id: 'gtm-agent',
  name: 'India GTM Agent',
  description: 'Builds India-first launch strategy, channels, creators, and early execution plan.',
  instructions:
    'Create the India-first launch plan and return only the final GTM object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  ...(isDevMode() ? {} : { tools: { gtmPlanTool } }),
});
