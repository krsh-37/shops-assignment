import test from 'node:test';
import assert from 'node:assert/strict';
import { domainAgent } from '../src/mastra/agents/index.js';
import { normalizeDomainMemory } from '../src/mastra/domain/openclaw/content.js';
import { domainIdeationTool, domainRankingTool } from '../src/mastra/tools/index.js';
import { createCompletedRun, genericIdea } from './test-helpers.js';

test('domain agent exposes ideation and availability tools', async () => {
  const tools = await domainAgent.listTools();

  assert.ok('domainIdeationTool' in tools);
  assert.ok('domainRankingTool' in tools);
});

test('domain ideation tool generates at least five candidates', async () => {
  const result = await (domainIdeationTool.execute as any)({ idea: genericIdea, constraints: [] }, {});

  assert.ok(result.candidates.length >= 5);
});

test('domain ranking tool checks availability shape', async () => {
  const result = await (domainRankingTool.execute as any)({ domain: 'sockzy.in' }, {});

  assert.equal(result.domain, 'sockzy.in');
  assert.equal(typeof result.available, 'boolean');
});

test('domain agent functionality populates a ranked top-five shortlist', async () => {
  const run = await createCompletedRun(genericIdea);

  assert.ok(run.memory.domains);
  assert.equal(run.memory.domains?.top5.length, 5);
  assert.equal(run.memory.domains?.candidates15.length, 15);
});

test('domain memory normalization tolerates unavailable candidates and brand-name recommendations', async () => {
  const result = normalizeDomainMemory({
    recommended: 'Restaurantly',
    top5: [
      { name: 'Restaurantly', domain: 'restaurantly.in', available: true, price_inr: 1200, score: 88, reasoning: 'Top choice.' },
      { name: 'RestaurantCo', domain: 'restaurantco.in', available: true, price_inr: 1100, score: 82, reasoning: 'Strong fallback.' },
      { name: 'RestaurantLane', domain: 'restaurantlane.in', available: false, price_inr: 0, score: 70, reasoning: 'Unavailable.' },
      { name: 'RestaurantHub', domain: 'restauranthub.in', available: true, price_inr: 900, score: 75, reasoning: 'Available.' },
      { name: 'RestaurantNow', domain: 'restaurantnow.in', available: true, price_inr: 950, score: 76, reasoning: 'Available.' },
    ],
    candidates15: Array.from({ length: 15 }, (_, index) => ({
      name: `Restaurant ${index + 1}`,
      domain: `restaurant-${index + 1}.in`,
      available: index < 12,
      price_inr: index < 12 ? 1000 + index * 10 : 0,
      score: 90 - index,
      reasoning: 'Candidate.',
    })),
  });

  assert.equal(result.recommended, 'restaurantly.in');
  assert.equal(result.top5.length, 5);
  assert.equal(result.candidates15.length, 15);
  assert.ok(result.candidates15.slice(12).every(candidate => candidate.price_inr === 0));
});
