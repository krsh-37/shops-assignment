import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { getLaunchRun, runLaunch, startLaunch } from '../src/mastra/services/openclaw-launch-service.js';
import { OpenClawMem0, mem0 } from '../src/mastra/memory/mem0.js';
import { sharedAgentMemory } from '../src/mastra/memory/shared-agent-memory.js';
import {
  adsAgent,
  domainAgent,
  gtmAgent,
  launchReportAgent,
  orchestratorAgent,
  researchAgent,
  seoAgent,
  shopifyAgent,
  visualAgent,
} from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { internalOpenclawWorkflow } from '../src/mastra/workflows/openclaw.js';

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

test('generic ideas still produce a top-5 domain shortlist', async () => {
  const run = await runLaunch('I want to launch a premium herbal tea brand for busy professionals in India.');

  assert.equal(run.memory.idea?.brand_name_candidates.length, 5);
  assert.equal(run.memory.domains?.top5.length, 5);
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

test('launch runs are durable across mem0 rehydration', async () => {
  const run = await runLaunch(sampleIdea);
  const persistedStore = resolve(process.cwd(), '.openclaw', 'runs.json');

  assert.ok(existsSync(persistedStore));

  const rehydrated = new OpenClawMem0().getRun(run.id);
  assert.ok(rehydrated);
  assert.equal(rehydrated?.id, run.id);
  assert.equal(rehydrated?.status, 'completed');
  assert.equal(rehydrated?.report?.brand.brand_name, run.report?.brand.brand_name);
});

test('startLaunch marks runs failed when workflow returns non-success', async () => {
  const originalCreateRun = internalOpenclawWorkflow.createRun.bind(internalOpenclawWorkflow);

  (internalOpenclawWorkflow as any).createRun = async () => ({
    start: async () => ({
      status: 'failed',
      error: new Error('simulated launch failure'),
    }),
  });

  try {
    const queued = startLaunch(sampleIdea);
    let resolved = getLaunchRun(queued.id);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (resolved?.status === 'failed') {
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      resolved = getLaunchRun(queued.id);
    }

    assert.ok(resolved);
    assert.equal(resolved?.status, 'failed');
    assert.equal(resolved?.error, 'simulated launch failure');
  } finally {
    (internalOpenclawWorkflow as any).createRun = originalCreateRun;
  }
});

test('agents have Mastra memory enabled for Studio threads', async () => {
  const memory = await researchAgent.getMemory();

  assert.equal(memory, sharedAgentMemory);
  assert.ok(memory);
});

test('specialist agents expose task-aligned tools', async () => {
  const researchTools = await researchAgent.listTools();
  const domainTools = await domainAgent.listTools();
  const visualTools = await visualAgent.listTools();
  const gtmTools = await gtmAgent.listTools();
  const shopifyTools = await shopifyAgent.listTools();
  const adsTools = await adsAgent.listTools();
  const seoTools = await seoAgent.listTools();
  const reportTools = await launchReportAgent.listTools();

  assert.ok('researchTool' in researchTools);
  assert.ok('fetchPageTool' in researchTools);
  assert.ok('mem0ReadTool' in researchTools);
  assert.ok('mem0WriteTool' in researchTools);
  assert.ok('domainRankingTool' in domainTools);
  assert.ok('domainIdeationTool' in domainTools);
  assert.ok('logoGenerationTool' in visualTools);
  assert.ok('visualDirectionTool' in visualTools);
  assert.ok('gtmPlanTool' in gtmTools);
  assert.ok('shopifyAssetsTool' in shopifyTools);
  assert.ok('adsStrategyTool' in adsTools);
  assert.ok('seoGeoTool' in seoTools);
  assert.ok('launchReportTool' in reportTools);
});

test('orchestrator exposes subagents and workflow for delegation', async () => {
  const agents = await orchestratorAgent.listAgents();
  const workflows = await orchestratorAgent.listWorkflows();
  const tools = await orchestratorAgent.listTools();

  assert.ok(Object.keys(agents).length >= 7);
  assert.equal('openclawWorkflow' in workflows, isDevMode());
  assert.ok('askUserTool' in tools);
  assert.ok('delegateToAgentTool' in tools);
  assert.ok('mem0ReadTool' in tools);
  assert.ok('mem0WriteTool' in tools);
  assert.ok('startLaunchWorkflowTool' in tools);
});
