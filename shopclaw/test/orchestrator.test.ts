import assert from 'node:assert/strict';
import test from 'node:test';
import { orchestrateLaunchRun, resumeLaunchRun, type LaunchClarificationInput } from '../mastra/agents/orchestrator.js';
import { InMemoryLaunchRunStore } from '../mastra/tools/launch-run.js';

test('orchestrateLaunchRun pauses and asks all required clarification questions when inputs are missing', async () => {
  const store = new InMemoryLaunchRunStore();
  let downstreamWorkStarted = false;

  const result = await orchestrateLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    {},
    () => new Date('2025-03-23T10:00:00.000Z'),
    {
      startDownstreamWork: async () => {
        downstreamWorkStarted = true;
      },
    },
  );

  assert.equal(result.status, 'paused');
  assert.equal(result.questions.length, 3);
  assert.equal(downstreamWorkStarted, false);
  assert.deepEqual(result.questions.map(({ key }) => key), ['targetCities', 'pricePoint', 'channelStrategy']);
  assert.equal(result.run.status, 'paused');
  assert.equal(result.run.downstreamAgentsStarted, false);
  assert.equal((await store.get(result.run.runId))?.status, 'paused');
});

test('orchestrateLaunchRun does not duplicate clarification questions when inputs already exist', async () => {
  const store = new InMemoryLaunchRunStore();

  const clarification: LaunchClarificationInput = {
    targetCities: 'Mumbai, Bengaluru',
  };

  const result = await orchestrateLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    clarification,
    () => new Date('2025-03-23T10:00:00.000Z'),
  );

  assert.equal(result.status, 'paused');
  assert.deepEqual(result.questions.map(({ key }) => key), ['pricePoint', 'channelStrategy']);
});

test('orchestrateLaunchRun continues when all required clarification inputs are present', async () => {
  const store = new InMemoryLaunchRunStore();
  let downstreamWorkStarted = 0;

  const result = await orchestrateLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    {
      targetCities: 'Mumbai, Bengaluru',
      pricePoint: 'INR 499',
      channelStrategy: 'D2C and quick-commerce',
    },
    () => new Date('2025-03-23T10:00:00.000Z'),
    {
      startDownstreamWork: async () => {
        downstreamWorkStarted += 1;
      },
    },
  );

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.questions, []);
  assert.equal(downstreamWorkStarted, 1);
  assert.equal(result.run.status, 'ready');
  assert.equal(result.run.downstreamAgentsStarted, true);
  assert.equal((await store.get(result.run.runId))?.status, 'ready');
});

test('resumeLaunchRun keeps the run paused until all clarification answers are present', async () => {
  const store = new InMemoryLaunchRunStore();

  const started = await orchestrateLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    { targetCities: 'Mumbai' },
    () => new Date('2025-03-23T10:00:00.000Z'),
  );

  const resumed = await resumeLaunchRun(
    started.run.runId,
    store,
    { pricePoint: 'INR 499' },
    () => new Date('2025-03-23T10:05:00.000Z'),
  );

  assert.equal(resumed.status, 'paused');
  assert.deepEqual(resumed.questions.map(({ key }) => key), ['channelStrategy']);
  assert.equal(resumed.run.statusHistory.at(-1)?.status, 'paused');
});

test('resumeLaunchRun marks the run ready once the last clarification answer arrives', async () => {
  const store = new InMemoryLaunchRunStore();

  const started = await orchestrateLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    { targetCities: 'Mumbai', pricePoint: 'INR 499' },
    () => new Date('2025-03-23T10:00:00.000Z'),
  );

  const resumed = await resumeLaunchRun(
    started.run.runId,
    store,
    { channelStrategy: 'D2C and quick-commerce' },
    () => new Date('2025-03-23T10:10:00.000Z'),
  );

  assert.equal(resumed.status, 'ready');
  assert.deepEqual(resumed.questions, []);
  assert.equal(resumed.run.statusHistory.at(-1)?.status, 'ready');
  assert.equal(resumed.run.downstreamAgentsStarted, true);
});
