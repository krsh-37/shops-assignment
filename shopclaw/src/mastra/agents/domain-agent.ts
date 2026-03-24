import { createOpenClawAgent, defaultModel } from './_shared.js';
import { domainRankingTool } from '../tools/domain-ranking-tool.js';

export const domainAgent = createOpenClawAgent({
  id: 'domain-agent',
  name: 'Domain Agent',
  description: 'Generates brand name and domain recommendations with ranking rationale.',
  instructions:
    'You generate brand names, check domain availability stubs, and rank the strongest shortlist by fit, memorability, and launch readiness using shared Mem0 context.',
  model: defaultModel,
  tools: { domainRankingTool },
});
