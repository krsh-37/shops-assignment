import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getLaunchRun, getLaunchStatus, resumeLaunch, runLaunch, selectVisualConcept, startLaunch } from '../src/mastra/services/openclaw-launch-service.js';
import { OpenClawMem0, mem0 } from '../src/mastra/memory/mem0.js';
import { internalOpenclawWorkflow } from '../src/mastra/workflows/openclaw.js';
import { createCompletedRun, sampleIdea } from './test-helpers.js';

test('runLaunch completes the OpenClaw workflow end to end', async () => {
  const run = await runLaunch(sampleIdea);

  assert.equal(run.status, 'completed');
  assert.ok(run.memory.idea);
  assert.ok(run.memory.research);
  assert.ok(run.memory.visual);
  assert.ok(run.memory.domains);
  assert.equal(run.memory.domains?.candidates15.length, 15);
  assert.ok(run.memory.gtm);
  assert.ok(run.memory.shopify);
  assert.ok(run.memory.ads);
  assert.ok(run.memory.seo);
  assert.ok(run.report);
});

test('startLaunch creates a draft launch and returns upfront clarification questions', async () => {
  const draft = await startLaunch(sampleIdea);
  assert.equal(draft.status, 'awaiting-user-input');
  assert.equal(draft.phase, 'clarification');
  assert.equal(draft.pendingQuestions.length, 5);
});

test('resumeLaunch advances the launch to visual selection after answers are captured', async () => {
  const draft = await startLaunch(sampleIdea);
  const queued = await resumeLaunch(
    draft.id,
    draft.pendingQuestions.map(question => question.assumption ?? 'Founder answer'),
  );

  let resolved = getLaunchRun(queued.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (resolved?.phase === 'visual-selection') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    resolved = getLaunchRun(queued.id);
  }

  assert.ok(resolved);
  assert.equal(resolved?.status, 'awaiting-user-input');
  assert.equal(resolved?.phase, 'visual-selection');
  assert.ok((resolved?.memory.visual?.logo_concepts.length ?? 0) === 3);
});

test('selectVisualConcept resumes the launch after visual review', async () => {
  const draft = await startLaunch(sampleIdea);
  await resumeLaunch(
    draft.id,
    draft.pendingQuestions.map(question => question.assumption ?? 'Founder answer'),
  );

  let paused = getLaunchRun(draft.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (paused?.phase === 'visual-selection') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    paused = getLaunchRun(draft.id);
  }

  assert.equal(paused?.phase, 'visual-selection');

  await selectVisualConcept(draft.id, 2);

  let completed = getLaunchRun(draft.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (completed?.status === 'completed') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    completed = getLaunchRun(draft.id);
  }

  assert.equal(completed?.status, 'completed');
  assert.equal(completed?.memory.visual?.chosen_concept, 2);
});

test('getLaunchStatus normalizes pending action and visual concepts', async () => {
  const draft = await startLaunch(sampleIdea);
  const draftStatus = getLaunchStatus(draft.id);

  assert.equal(draftStatus.next_action, 'answer-clarifications');
  assert.equal(draftStatus.phase, 'clarification');

  await resumeLaunch(
    draft.id,
    draft.pendingQuestions.map(question => question.assumption ?? 'Founder answer'),
  );

  let visualStatus = getLaunchStatus(draft.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (visualStatus.phase === 'visual-selection') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    visualStatus = getLaunchStatus(draft.id);
  }

  assert.equal(visualStatus.next_action, 'select-visual-concept');
  assert.equal(visualStatus.phase, 'visual-selection');
  assert.equal(visualStatus.visual_concepts?.length, 3);
});

test('workflow writes shared memory and audit log', async () => {
  const run = await createCompletedRun();
  const memory = mem0.read(run.id);

  assert.equal(memory.visual?.brand_name, run.memory.visual?.brand_name);
  assert.equal(memory.domains?.recommended, run.memory.domains?.recommended);
  assert.ok(memory.audit_log.length >= 8);
});

test('launch runs are durable across mem0 rehydration', async () => {
  const run = await createCompletedRun();
  const persistedStore = resolve(process.cwd(), '.openclaw', 'runs.json');

  assert.ok(existsSync(persistedStore));

  let rehydrated = new OpenClawMem0().getRun(run.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (rehydrated?.status === 'completed') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    rehydrated = new OpenClawMem0().getRun(run.id);
  }

  assert.ok(rehydrated);
  assert.equal(rehydrated?.status, 'completed');
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
    const draft = await startLaunch(sampleIdea);
    await assert.rejects(
      () =>
        resumeLaunch(
          draft.id,
          draft.pendingQuestions.map(question => question.assumption ?? 'Founder answer'),
        ),
      /simulated launch failure/,
    );

    const resolved = getLaunchRun(draft.id);
    assert.ok(resolved);
    assert.equal(resolved?.status, 'failed');
    assert.equal(resolved?.error, 'simulated launch failure');
  } finally {
    (internalOpenclawWorkflow as any).createRun = originalCreateRun;
  }
});
