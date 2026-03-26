import test from 'node:test';
import assert from 'node:assert/strict';
import { visualAgent } from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { logoGenerationTool, visualDirectionTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('visual agent exposes logo generation and visual direction tools', async () => {
  const tools = await visualAgent.listTools();

  assert.ok('logoGenerationTool' in tools);
  assert.equal('visualDirectionTool' in tools, !isDevMode());
});

test('logo generation tool returns a nanobanana-shaped concept payload', async () => {
  const result = await (logoGenerationTool.execute as any)(
    {
      prompt: 'Design a bold wordmark for Sockzy',
      style: 'bold',
      brand_context: 'Sockzy quick commerce sock brand',
    },
    {},
  );

  assert.equal(result.provider, 'nanobanana-stub');
  assert.ok(result.image_url.includes('sockzy'));
});

test('visual direction tool produces three concepts', async () => {
  const run = await createCompletedRun();
  const result = await (visualDirectionTool.execute as any)({ memory: run.memory }, {});

  assert.equal(result.logo_concepts.length, 3);
});

test('visual agent functionality populates chosen concept and palette', async () => {
  const run = await createCompletedRun();

  assert.ok(run.memory.visual);
  assert.equal(run.memory.visual?.logo_concepts.length, 3);
  assert.ok((run.memory.visual?.palette.length ?? 0) >= 3);
});
