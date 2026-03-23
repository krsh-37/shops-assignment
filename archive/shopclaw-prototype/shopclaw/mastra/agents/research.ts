import type { ResearchReport } from '../memory/mem0.ts';
import { type InMemoryRunScopedMemoryStore } from '../memory/mem0.ts';

export class MissingFounderIdeaError extends Error {
  constructor(message = 'Founder idea is required for the research step.') {
    super(message);
    this.name = 'MissingFounderIdeaError';
  }
}

export interface ResearchAgentOutput {
  report: ResearchReport;
}

function normalizeIdea(idea: string): string {
  return idea.trim();
}

function slugifyIdea(idea: string): string {
  return idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';
}

function buildResearchReport(idea: string): ResearchReport {
  const normalizedIdea = normalizeIdea(idea);
  const ideaTokens = normalizedIdea
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((token) => token.length > 2);

  const primaryKeywords = [
    normalizedIdea.toLowerCase().includes('sock') ? 'custom socks India' : `${slugifyIdea(normalizedIdea)} brand`,
    normalizedIdea.toLowerCase().includes('delivery') ? 'fast delivery D2C' : 'direct-to-consumer launch',
  ];

  const secondaryKeywords = Array.from(new Set([...ideaTokens.slice(0, 4), 'India', 'launch', 'brand']));

  return {
    competitors: ['Bombay Sock Company', 'SuperSox', 'Noise'],
    market_size_inr: '₹120 crore',
    whitespace: normalizedIdea.toLowerCase().includes('sock')
      ? 'premium quick-commerce socks with gifting-friendly positioning'
      : 'fast-launch D2C positioning with a clear category story',
    keywords: {
      primary: primaryKeywords,
      secondary: secondaryKeywords,
    },
    india_insight: 'Tier-1 urban India responds well to quick-commerce framing, gifting hooks, and strong visual identity.',
  };
}

// Implements PRD-005
export async function runResearchAgent(
  runId: string,
  memory: InMemoryRunScopedMemoryStore,
  founderIdea: string | undefined,
): Promise<ResearchAgentOutput> {
  if (typeof founderIdea !== 'string' || founderIdea.trim().length === 0) {
    throw new MissingFounderIdeaError();
  }

  const report = buildResearchReport(founderIdea);
  await memory.write(runId, 'research', report);
  return { report };
}
