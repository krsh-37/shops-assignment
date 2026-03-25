import { isDevMode } from '../config/openclaw-config.js';
import { fetchPageTool } from '../tools/fetch-page-tool.js';
import { researchTool } from '../tools/research-tool.js';
import { createOpenClawAgent, defaultModel } from './_shared.js';

export const researchAgent = createOpenClawAgent({
  id: 'research-agent',
  name: 'Research Agent',
  description: 'Produces market analysis, competitors, whitespace, and keyword strategy for a launch idea.',
  instructions:
    'Synthesize market analysis, competitors, whitespace, and keyword strategy from the provided India evidence pack. If web search and page fetch tools are available, use them before answering. Return only the final structured research object.',
  model: defaultModel,
  ...(isDevMode() ? {} : { tools: { researchTool, fetchPageTool } }),
});
