import { createOpenClawAgent, defaultModel } from './_shared.js';
import { researchTool } from '../tools/research-tool.js';

export const researchAgent = createOpenClawAgent({
  id: 'research-agent',
  name: 'Research Agent',
  description: 'Produces market analysis, competitors, whitespace, and keyword strategy for a launch idea.',
  instructions:
    'You produce India-aware market analysis, competitor mapping, whitespace, TAM framing, and keyword guidance for a new launch idea using shared Mem0 context.',
  model: defaultModel,
  tools: { researchTool },
});
