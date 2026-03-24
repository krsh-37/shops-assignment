import { createOpenClawAgent, defaultModel } from './_shared.js';
import { visualDirectionTool } from '../tools/visual-direction-tool.js';

export const visualAgent = createOpenClawAgent({
  id: 'visual-agent',
  name: 'Visual Agent',
  description: 'Creates brand name selection, logo directions, palette, and mood.',
  instructions:
    'You generate three brand identity directions, logo prompts, palette decisions, and a chosen concept rooted in prior research and Mem0 state.',
  model: defaultModel,
  tools: { visualDirectionTool },
});
