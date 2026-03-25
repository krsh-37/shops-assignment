import { createTool } from '@mastra/core/tools';
import { domainIdeationInputSchema, domainIdeationSchema } from '../domain/openclaw/schemas.js';
import { generateBrandCandidates, inferCategory } from '../domain/openclaw/content.js';

export const domainIdeationTool = createTool({
  id: 'openclaw-domain-ideation-tool',
  description: 'Generate a shortlist of brand names and candidate domains before availability checks.',
  inputSchema: domainIdeationInputSchema,
  outputSchema: domainIdeationSchema,
  execute: async ({ idea, category }) => {
    const inferredCategory = category ?? inferCategory(idea);
    const names = generateBrandCandidates(idea);

    return {
      candidates: names.map(name => ({
        name,
        domain: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.in`,
        reasoning: `${name} matches the ${inferredCategory} positioning and is short enough for memorable launch branding.`,
      })),
    };
  },
});
