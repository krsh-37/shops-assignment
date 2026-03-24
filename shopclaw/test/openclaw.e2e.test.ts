import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaunchRun, runLaunch, startLaunch } from '../src/mastra/services/openclaw-launch-service.js';
import { mem0 } from '../src/mastra/memory/mem0.js';
import { sharedAgentMemory } from '../src/mastra/memory/shared-agent-memory.js';
import { researchAgent, orchestratorAgent } from '../src/mastra/agents/index.js';

const sampleIdea = 'I want to sell custom socks delivered in 10 minutes like Zepto but for socks.';

test('runLaunch completes the OpenClaw workflow end to end', async () => {
  const run = await runLaunch(sampleIdea);

  assert.equal(run.status, 'completed');
  assert.ok(run.memory.idea);
  assert.ok(run.memory.research);
  assert.ok(run.memory.visual);
  assert.ok(run.memory.domains);
  assert.ok(run.memory.gtm);
  assert.ok(run.memory.shopify);
  assert.ok(run.memory.ads);
  assert.ok(run.memory.seo);
  assert.ok(run.report);
  assert.ok(run.completedAgents.includes('research-agent'));
  assert.ok(run.completedAgents.includes('launch-report-agent'));
});

test('Shopify output compounds visual palette and research keywords', async () => {
  const run = await runLaunch(sampleIdea);
  const palette = run.memory.visual?.palette ?? [];
  const products = run.memory.shopify?.products ?? [];
  const keywords = run.memory.research?.keywords.primary ?? [];

  assert.deepEqual(run.memory.shopify?.theme_settings.palette, palette);
  assert.ok(products.some(product => keywords.some(keyword => product.description.includes(keyword))));
});

test('startLaunch exposes async status that can be polled', async () => {
  const queued = startLaunch(sampleIdea);
  assert.equal(queued.status, 'queued');

  let resolved = getLaunchRun(queued.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (resolved?.status === 'completed') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    resolved = getLaunchRun(queued.id);
  }

  assert.ok(resolved);
  assert.equal(resolved?.status, 'completed');
  assert.ok(resolved?.report?.markdown.includes('OpenClaw Launch Bible'));
});

test('workflow writes structured shared memory into Mem0', async () => {
  const run = await runLaunch(sampleIdea);
  const memory = mem0.read(run.id);

  assert.equal(memory.visual?.brand_name, run.memory.visual?.brand_name);
  assert.equal(memory.domains?.recommended, run.memory.domains?.recommended);
  assert.ok(memory.audit_log.length >= 8);
});

test('agents have Mastra memory enabled for Studio threads', async () => {
  const memory = await researchAgent.getMemory();

  assert.equal(memory, sharedAgentMemory);
  assert.ok(memory);
});

test('orchestrator exposes subagents and workflow for delegation', async () => {
  const agents = await orchestratorAgent.listAgents();
  const workflows = await orchestratorAgent.listWorkflows();

  assert.ok(Object.keys(agents).length >= 7);
  assert.ok('openclawWorkflow' in workflows);
});
