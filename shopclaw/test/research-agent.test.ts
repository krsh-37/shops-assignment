import test from 'node:test';
import assert from 'node:assert/strict';
import { researchAgent } from '../src/mastra/agents/index.js';
import { fetchPageTool, researchTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('research agent exposes research and fetch tools', async () => {
  const tools = await researchAgent.listTools();

  assert.ok('researchTool' in tools);
  assert.ok('fetchPageTool' in tools);
});

test('research tool returns search results in staging', async () => {
  const result = await (researchTool.execute as any)({ query: 'custom socks india' }, {});

  assert.equal(result.query, 'custom socks india');
  assert.ok(result.results.length >= 1);
});

test('fetch page tool returns page content', async () => {
  const result = await (fetchPageTool.execute as any)({ url: 'https://example.com/test-page' }, {});

  assert.equal(result.url, 'https://example.com/test-page');
  assert.ok(result.content.length > 0);
});

test('research agent functionality populates research memory', async () => {
  const run = await createCompletedRun();

  assert.ok(run.memory.research);
  assert.ok(run.memory.research?.competitors.length >= 3);
  assert.ok(run.memory.research?.keywords.primary.length >= 3);
});
