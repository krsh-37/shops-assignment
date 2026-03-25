import { createOpenClawAgent, defaultModel } from './_shared.js';
import { adsStrategyTool } from '../tools/ads-strategy-tool.js';

export const adsAgent = createOpenClawAgent({
  id: 'ads-agent',
  name: 'Performance Ads Agent',
  description: 'Creates Meta and Google launch strategy from shared brand context.',
  instructions:
    'Create the Meta and Google launch strategy and return only the final ads object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  tools: { adsStrategyTool },
});
