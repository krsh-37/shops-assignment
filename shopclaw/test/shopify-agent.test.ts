import test from 'node:test';
import assert from 'node:assert/strict';
import { shopifyAgent } from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { shopifyAssetsTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('shopify agent exposes asset generation tool', async () => {
  const tools = await shopifyAgent.listTools();

  assert.equal('shopifyAssetsTool' in tools, !isDevMode());
});

test('shopify assets tool returns package-grade files', async () => {
  const run = await createCompletedRun();
  const result = await (shopifyAssetsTool.execute as any)({ memory: run.memory }, {});

  assert.ok(result.files.length >= 4);
  assert.ok(result.package_summary.length > 0);
});

test('shopify functionality compounds visual palette and research keywords', async () => {
  const run = await createCompletedRun();
  const palette = run.memory.visual?.palette ?? [];
  const keywords = run.memory.research?.keywords.primary ?? [];

  assert.deepEqual(run.memory.shopify?.theme_settings.palette, palette);
  assert.ok(run.memory.shopify?.products.some(product => keywords.some(keyword => product.description.includes(keyword))));
});
