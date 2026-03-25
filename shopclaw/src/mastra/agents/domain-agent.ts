import { createOpenClawAgent, defaultModel } from './_shared.js';
import { domainIdeationTool } from '../tools/domain-ideation-tool.js';
import { domainRankingTool } from '../tools/domain-ranking-tool.js';

export const domainAgent = createOpenClawAgent({
  id: 'domain-agent',
  name: 'Domain Agent',
  description: 'Generates brand name and domain recommendations with ranking rationale.',
  instructions:
    'Ideate candidate names, check availability, and return only the final ranked domain shortlist object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  tools: { domainRankingTool, domainIdeationTool },
});
