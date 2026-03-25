import { createTool } from '@mastra/core/tools';
import { getSearchProvider } from '../providers/search-provider.js';
import { tavilySearchInputSchema, tavilySearchOutputSchema } from '../domain/openclaw/schemas.js';

const provider = getSearchProvider();

export const researchTool = createTool({
  id: 'openclaw-research-tool',
  description: 'Search the web for launch market, competitor, and keyword intelligence.',
  inputSchema: tavilySearchInputSchema,
  outputSchema: tavilySearchOutputSchema,
  execute: async ({ query }) => ({
    query,
    results: await provider.search(query),
  }),
});
