import { createOpenClawAgent, defaultModel } from './_shared.js';
import { domainIdeationTool } from '../tools/domain-ideation-tool.js';
import { domainRankingTool } from '../tools/domain-ranking-tool.js';

export const domainAgent = createOpenClawAgent({
  id: 'domain-agent',
  name: 'Domain Agent',
  description: 'Generates 15 brand name and domain candidates, then returns a ranked shortlist with rationale.',
  instructions:
    'Ideate 15 candidate names, check availability, and return the full candidate set plus the final ranked top-five shortlist object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  tools: { domainRankingTool, domainIdeationTool },
});
