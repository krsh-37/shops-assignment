import { createOpenClawAgent, defaultModel } from './_shared.js';
import { gtmPlanTool } from '../tools/gtm-plan-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';

export const gtmAgent = createOpenClawAgent({
  id: 'gtm-agent',
  name: 'India GTM Agent',
  description: 'Builds India-first launch strategy, channels, creators, and early execution plan.',
  instructions:
    'You own the gtm memory section. Read research, domains, and visual memory before acting. Then create the India-first launch plan and write only the GTM package back into shared memory.',
  model: defaultModel,
  tools: { gtmPlanTool, mem0ReadTool, mem0WriteTool },
});
