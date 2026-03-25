import { createOpenClawAgent, defaultModel } from './_shared.js';
import { fetchPageTool } from '../tools/fetch-page-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';
import { researchTool } from '../tools/research-tool.js';

export const researchAgent = createOpenClawAgent({
  id: 'research-agent',
  name: 'Research Agent',
  description: 'Produces market analysis, competitors, whitespace, and keyword strategy for a launch idea.',
  instructions:
    'You own the research memory section. Read shared memory before acting, use web search and page fetch tools to gather evidence, then write the structured research result and a concise markdown-style summary back into memory.',
  model: defaultModel,
  tools: { researchTool, fetchPageTool, mem0ReadTool, mem0WriteTool },
});
