import { createTool } from '@mastra/core/tools';
import { getDomainProvider } from '../providers/domain-provider.js';
import { domainAvailabilityInputSchema, domainAvailabilityOutputSchema } from '../domain/openclaw/schemas.js';

const provider = getDomainProvider();

export const domainRankingTool = createTool({
  id: 'openclaw-domain-ranking-tool',
  description: 'Check domain availability using RDAP.',
  inputSchema: domainAvailabilityInputSchema,
  outputSchema: domainAvailabilityOutputSchema,
  execute: async ({ domain }) => provider.check(domain),
});
