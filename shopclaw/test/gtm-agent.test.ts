import test from 'node:test';
import assert from 'node:assert/strict';
import { gtmAgent } from '../src/mastra/agents/index.js';
import { gtmPlanTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('gtm agent exposes plan generation tool', async () => {
  const tools = await gtmAgent.listTools();

  assert.ok('gtmPlanTool' in tools);
});

test('gtm plan tool returns a full India-first plan', async () => {
  const run = await createCompletedRun();
  const result = await (gtmPlanTool.execute as any)({ memory: run.memory }, {});

  assert.equal(result.reel_ideas.length, 10);
  assert.ok(result.launch_cities.length >= 3);
});

test('gtm agent functionality populates launch channels and checklist', async () => {
  const run = await createCompletedRun();

  assert.ok(run.memory.gtm);
  assert.equal(run.memory.gtm?.reel_ideas.length, 10);
  assert.ok((run.memory.gtm?.week1_checklist.length ?? 0) >= 5);
});
