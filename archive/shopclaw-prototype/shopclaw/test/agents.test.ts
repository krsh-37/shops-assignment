import assert from 'node:assert/strict';
import test from 'node:test';
import { runDomainAgent } from '../mastra/agents/domain.ts';
import { runResearchAgent, MissingFounderIdeaError } from '../mastra/agents/research.ts';
import { runVisualAgent } from '../mastra/agents/visual.ts';
import { InMemoryRunScopedMemoryStore } from '../mastra/memory/mem0.ts';

test('research agent writes a structured report when the founder idea exists', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  const result = await runResearchAgent('run-1', store, 'I want to sell custom socks delivered in 10 minutes');

  assert.deepEqual(result.report.competitors, ['Bombay Sock Company', 'SuperSox', 'Noise']);
  assert.ok(result.report.keywords.primary.length >= 2);
  assert.equal((await store.read('run-1', 'research')).market_size_inr, '₹120 crore');
});

test('research agent fails when the founder idea is missing', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  await assert.rejects(runResearchAgent('run-1', store, '   '), MissingFounderIdeaError);
});

test('visual agent writes exactly three concepts from stored research', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  await store.write('run-1', 'research', {
    competitors: ['Bombay Sock Company'],
    market_size_inr: '₹120 crore',
    whitespace: 'premium quick-commerce socks',
    keywords: {
      primary: ['custom socks India'],
      secondary: ['gifting', 'quick-commerce'],
    },
    india_insight: 'Tier-1 India likes quick-commerce framing.',
  });

  const result = await runVisualAgent('run-1', store);

  assert.equal(result.visual.logo_concepts.length, 3);
  assert.equal((await store.read('run-1', 'visual')).logo_concepts.length, 3);
});

test('visual agent fails when research data is missing', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  await assert.rejects(runVisualAgent('run-1', store), /Requested memory value is not available/i);
});

test('domain agent ranks five candidates and marks availability failures as unavailable', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  await store.write('run-1', 'research', {
    competitors: ['Bombay Sock Company'],
    market_size_inr: '₹120 crore',
    whitespace: 'premium quick-commerce socks',
    keywords: {
      primary: ['custom socks India'],
      secondary: ['gifting', 'quick-commerce'],
    },
    india_insight: 'Tier-1 India likes quick-commerce framing.',
  });

  const result = await runDomainAgent('run-1', store, {
    candidates: ['sockzy.in', 'sockzy.com', 'wearsockzy.com', 'getsockzy.in', 'sockzyco.in'],
    availabilityCheck: async (domain) => {
      if (domain === 'sockzy.com') {
        throw new Error('lookup failed');
      }

      return {
        available: domain !== 'wearsockzy.com',
        price: domain.endsWith('.in') ? 799 : 1299,
      };
    },
  });

  assert.equal(result.domains.top5.length, 5);
  assert.equal(result.domains.top5[1].available, false);
  assert.equal(result.domains.top5[2].available, false);
  assert.equal(result.domains.recommended, 'sockzy.in');
});
