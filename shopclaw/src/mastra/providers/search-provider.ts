import { tavily } from '@tavily/core';
import { getOpenClawConfig, isDevMode } from '../config/openclaw-config.js';

export type SearchResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

export interface SearchProvider {
  search(query: string): Promise<SearchResult[]>;
}

class TavilySearchProvider implements SearchProvider {
  private readonly client = tavily({
    apiKey: getOpenClawConfig().tavilyApiKey,
  });

  async search(query: string): Promise<SearchResult[]> {
    const response = await this.client.search(query, {
      searchDepth: 'advanced',
      topic: 'general',
      maxResults: 5,
      includeAnswer: false,
      includeRawContent: false,
      country: 'india',
    });

    return response.results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));
  }
}

class StubSearchProvider implements SearchProvider {
  async search(query: string): Promise<SearchResult[]> {
    return [
      {
        title: `Stub result for ${query}`,
        url: 'https://example.com/stub-result',
        content: `Stubbed research content for query: ${query}`,
        score: 1,
      },
    ];
  }
}

export function getSearchProvider(): SearchProvider {
  return isDevMode() ? new TavilySearchProvider() : new StubSearchProvider();
}
