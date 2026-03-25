import { createTool } from '@mastra/core/tools';
import { isDevMode } from '../config/openclaw-config.js';
import { fetchPageInputSchema, fetchPageOutputSchema } from '../domain/openclaw/schemas.js';

export const fetchPageTool = createTool({
  id: 'openclaw-fetch-page-tool',
  description: 'Fetch and summarize a webpage for research synthesis.',
  inputSchema: fetchPageInputSchema,
  outputSchema: fetchPageOutputSchema,
  execute: async ({ url }) => {
    if (!isDevMode()) {
      return {
        url,
        title: 'Stub page',
        content: `Stubbed fetched content for ${url}`,
      };
    }

    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) {
      throw new Error(`Page fetch failed for ${url} with status ${response.status}`);
    }

    const content = await response.text();
    return {
      url,
      title: url,
      content: content.slice(0, 4000),
    };
  },
});
