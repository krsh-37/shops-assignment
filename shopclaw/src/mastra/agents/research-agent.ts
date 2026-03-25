import { createOpenClawAgent, defaultModel } from './_shared.js';
import { fetchPageTool } from '../tools/fetch-page-tool.js';
import { researchTool } from '../tools/research-tool.js';

export const researchAgent = createOpenClawAgent({
  id: 'research-agent',
  name: 'Research Agent',
  description: 'Produces market analysis, competitors, whitespace, and keyword strategy for a launch idea.',
  instructions:
    'Use web search and page fetch tools to gather evidence, then return only the final structured research object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  tools: { researchTool, fetchPageTool },
});
