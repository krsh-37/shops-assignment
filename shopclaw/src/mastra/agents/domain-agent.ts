import { createOpenClawAgent, defaultModel } from './_shared.js';
import { domainIdeationTool } from '../tools/domain-ideation-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';
import { domainRankingTool } from '../tools/domain-ranking-tool.js';

export const domainAgent = createOpenClawAgent({
  id: 'domain-agent',
  name: 'Domain Agent',
  description: 'Generates brand name and domain recommendations with ranking rationale.',
  instructions:
    'You own the domains memory section. Read idea and research memory first, ideate candidate names, check availability, and write only the ranked domain shortlist back into shared memory.',
  model: defaultModel,
  tools: { domainRankingTool, domainIdeationTool, mem0ReadTool, mem0WriteTool },
});
