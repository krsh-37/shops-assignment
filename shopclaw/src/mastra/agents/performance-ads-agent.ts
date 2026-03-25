import { createOpenClawAgent, defaultModel } from './_shared.js';
import { adsStrategyTool } from '../tools/ads-strategy-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';

export const adsAgent = createOpenClawAgent({
  id: 'ads-agent',
  name: 'Performance Ads Agent',
  description: 'Creates Meta and Google launch strategy from shared brand context.',
  instructions:
    'You own the ads memory section. Read research, GTM, and visual memory before acting. Create the Meta and Google launch strategy and write only the ads package back into shared memory.',
  model: defaultModel,
  tools: { adsStrategyTool, mem0ReadTool, mem0WriteTool },
});
