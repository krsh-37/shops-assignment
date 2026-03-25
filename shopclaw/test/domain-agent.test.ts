import test from 'node:test';
import assert from 'node:assert/strict';
import { domainAgent } from '../src/mastra/agents/index.js';
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
});
