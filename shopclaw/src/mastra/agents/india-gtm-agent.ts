import { createOpenClawAgent, defaultModel } from './_shared.js';
import { gtmPlanTool } from '../tools/gtm-plan-tool.js';

export const gtmAgent = createOpenClawAgent({
  id: 'gtm-agent',
  name: 'India GTM Agent',
  description: 'Builds India-first launch strategy, channels, creators, and early execution plan.',
  instructions:
    'You create an India-first launch plan with city priority, channel mix, reel hooks, influencer strategy, and week-one activation tasks using shared Mem0 context.',
  model: defaultModel,
  tools: { gtmPlanTool },
});
