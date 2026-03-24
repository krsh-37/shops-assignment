import { createOpenClawAgent, defaultModel } from './_shared.js';
import { adsStrategyTool } from '../tools/ads-strategy-tool.js';

export const adsAgent = createOpenClawAgent({
  id: 'ads-agent',
  name: 'Performance Ads Agent',
  description: 'Creates Meta and Google launch strategy from shared brand context.',
  instructions:
    'You create Meta and Google launch strategy from the shared brand context in Mem0 without re-asking for already-known information.',
  model: defaultModel,
  tools: { adsStrategyTool },
});
