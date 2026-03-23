import assert from 'node:assert/strict';
import test from 'node:test';
import { InMemoryLaunchRunStore } from '../mastra/tools/launch-run.ts';
import { orchestrateLaunchRun, type LaunchClarificationInput } from '../mastra/agents/orchestrator.ts';

test('orchestrateLaunchRun pauses and asks all required clarification questions when inputs are missing', async () => {
  const store = new InMemoryLaunchRunStore();
  let downstreamWorkStarted = false;

  const result = await orchestrateLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    {},
    async () => {
      downstreamWorkStarted = true;
    },
    () => new Date('2025-03-23T10:00:00.000Z'),
  );

  assert.equal(result.status, 'paused');
  assert.equal(result.questions.length, 3);
  assert.equal(downstreamWorkStarted, false);
  assert.deepEqual(result.questions.map(({ key }) => key), ['targetCities', 'pricePoint', 'channelStrategy']);
  assert.deepEqual(result.questions.map(({ question }) => question), [
    'What cities in India should we prioritise first?',
    "What's the price point you're targeting?",
    'Direct-to-consumer only, or open to quick-commerce channels?',
  ]);
  assert.equal(result.run.status, 'paused');
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
    async () => {},
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
      pricePoint: '₹499',
      channelStrategy: 'D2C and quick-commerce',
    },
    async () => {
      downstreamWorkStarted += 1;
    },
    () => new Date('2025-03-23T10:00:00.000Z'),
  );

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.questions, []);
  assert.equal(downstreamWorkStarted, 1);
  assert.equal(result.run.status, 'ready');
  assert.equal((await store.get(result.run.runId))?.status, 'ready');
});
