import test from 'node:test';
import assert from 'node:assert/strict';
import { seoAgent } from '../src/mastra/agents/index.js';
import { seoGeoTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('seo agent exposes geo generation and memory tools', async () => {
  const tools = await seoAgent.listTools();

  assert.ok('seoGeoTool' in tools);
  assert.ok('mem0ReadTool' in tools);
  assert.ok('mem0WriteTool' in tools);
});

test('seo geo tool returns page-grade GEO content', async () => {
  const run = await createCompletedRun();
  const result = await (seoGeoTool.execute as any)({ memory: run.memory }, {});

  assert.equal(result.geo_pages.length, 5);
  assert.ok(result.geo_pages.every((page: { body: string }) => page.body.length > 0));
});

test('seo functionality populates keywords, FAQs, and geo pages', async () => {
  const run = await createCompletedRun();

  assert.ok(run.memory.seo);
  assert.equal(run.memory.seo?.geo_faqs.length, 5);
  assert.equal(run.memory.seo?.geo_pages.length, 5);
});
