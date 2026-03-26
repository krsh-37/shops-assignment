import test from 'node:test';
import assert from 'node:assert/strict';
import { adsAgent } from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { adsStrategyTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('ads agent exposes ads strategy tool', async () => {
  const tools = await adsAgent.listTools();

  assert.equal('adsStrategyTool' in tools, !isDevMode());
});

test('ads strategy tool returns meta and google campaign structures', async () => {
  const run = await createCompletedRun();
  const result = await (adsStrategyTool.execute as any)({ memory: run.memory }, {});

  assert.equal(result.meta_ads.length, 3);
  assert.equal(result.google_campaigns.length, 2);
});

test('ads functionality populates pacing plan and creative hooks', async () => {
  const run = await createCompletedRun();

  assert.ok(run.memory.ads);
  assert.equal(run.memory.ads?.meta_ads.length, 3);
  assert.ok((run.memory.ads?.pacing_plan.milestones.length ?? 0) >= 3);
});
