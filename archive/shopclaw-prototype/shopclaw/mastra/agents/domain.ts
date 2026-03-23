import type { DomainCandidate, DomainMemory } from '../memory/mem0.ts';
import { type InMemoryRunScopedMemoryStore } from '../memory/mem0.ts';

export interface DomainAvailabilityResult {
  available: boolean;
  price: number;
}

export type DomainAvailabilityChecker = (domain: string) => Promise<DomainAvailabilityResult>;

export interface DomainAgentOutput {
  domains: DomainMemory;
}

function slugifyIdea(idea: string): string {
  return idea.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';
}

function buildDomainCandidates(seed: string): string[] {
  const base = slugifyIdea(seed);
  return [
    `${base}.in`,
    `${base}.com`,
    `get${base}.in`,
    `wear${base}.com`,
    `${base}co.in`,
  ];
}

async function defaultDomainAvailabilityChecker(domain: string): Promise<DomainAvailabilityResult> {
  return {
    available: !domain.includes('noise'),
    price: domain.endsWith('.in') ? 799 : 1299,
  };
}

// Implements PRD-007
export async function runDomainAgent(
  runId: string,
  memory: InMemoryRunScopedMemoryStore,
  options: {
    seed?: string;
    candidates?: string[];
    availabilityCheck?: DomainAvailabilityChecker;
  } = {},
): Promise<DomainAgentOutput> {
  const research = await memory.read(runId, 'research').catch(() => null);
  const seed = options.seed ?? research?.keywords.primary[0] ?? 'brand';
  const candidates = (options.candidates?.length ? options.candidates : buildDomainCandidates(seed)).slice(0, 5);
  const availabilityCheck = options.availabilityCheck ?? defaultDomainAvailabilityChecker;

  const top5 = await Promise.all(
    candidates.map(async (domain): Promise<DomainCandidate> => {
      try {
        const availability = await availabilityCheck(domain);
        return {
          domain,
          available: availability.available,
          price: availability.price,
          reason: availability.available ? 'available' : 'already registered',
        };
      } catch {
        return {
          domain,
          available: false,
          price: 0,
          reason: 'availability check failed',
        };
      }
    }),
  );

  while (top5.length < 5) {
    const filler = `${slugifyIdea(seed)}-${top5.length + 1}.in`;
    top5.push({
      domain: filler,
      available: false,
      price: 0,
      reason: 'filler candidate',
    });
  }

  const recommended = top5.find((candidate) => candidate.available)?.domain ?? top5[0].domain;
  const domains: DomainMemory = {
    recommended,
    top5: top5.slice(0, 5) as DomainMemory['top5'],
  };

  await memory.write(runId, 'domains', domains);
  return { domains };
}
