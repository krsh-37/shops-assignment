import test from 'node:test';
import assert from 'node:assert/strict';
import { launchReportAgent } from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { launchReportTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('launch report agent exposes report generation tool', async () => {
  const tools = await launchReportAgent.listTools();

  assert.equal('launchReportTool' in tools, !isDevMode());
});

test('launch report tool compiles artifact references', async () => {
  const run = await createCompletedRun();
  const result = await (launchReportTool.execute as any)({ memory: run.memory }, {});

  assert.ok(result.artifacts.length >= 4);
  assert.ok(result.markdown.includes('OpenClaw Launch Bible'));
});

test('launch report functionality returns final launch bible', async () => {
  const run = await createCompletedRun();

  assert.ok(run.report);
  assert.ok(run.report?.artifacts.length);
  assert.ok(run.report?.markdown.includes('OpenClaw Launch Bible'));
});
