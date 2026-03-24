import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InMemoryLaunchRunStore,
  InvalidFounderPromptError,
  type LaunchRunStore,
  startLaunchRun,
} from '../mastra/tools/launch-run.js';

test('startLaunchRun creates a run-scoped record for a valid founder prompt', async () => {
  const store = new InMemoryLaunchRunStore();

  const record = await startLaunchRun(
    'I want to sell custom socks delivered in 10 minutes',
    store,
    {},
    () => new Date('2025-03-23T10:00:00.000Z'),
  );

  assert.equal(record.prompt, 'I want to sell custom socks delivered in 10 minutes');
  assert.equal(record.status, 'initialized');
  assert.equal(record.createdAt, '2025-03-23T10:00:00.000Z');
  assert.equal(record.updatedAt, '2025-03-23T10:00:00.000Z');
  assert.match(record.runId, /^[0-9a-f-]{36}$/u);

  const stored = await store.get(record.runId);
  assert.deepEqual(stored, record);
});

test('startLaunchRun trims surrounding whitespace from a founder prompt', async () => {
  const store = new InMemoryLaunchRunStore();

  const record = await startLaunchRun('  I want to sell custom socks  ', store);

  assert.equal(record.prompt, 'I want to sell custom socks');
});

test('startLaunchRun rejects an empty founder prompt without creating a record', async () => {
  const store = new InMemoryLaunchRunStore();

  await assert.rejects(startLaunchRun('   ', store), InvalidFounderPromptError);
  assert.equal((await store.list()).length, 0);
});

test('startLaunchRun rejects a non-string founder prompt without creating a record', async () => {
  const store = new InMemoryLaunchRunStore();

  await assert.rejects(startLaunchRun({ idea: 'custom socks' }, store), InvalidFounderPromptError);
  assert.equal((await store.list()).length, 0);
});

test('startLaunchRun does not report success when persistence fails', async () => {
  const store: LaunchRunStore = {
    async save() {
      throw new Error('disk unavailable');
    },
    async get() {
      return null;
    },
    async list() {
      return [];
    },
  };

  await assert.rejects(
    startLaunchRun('I want to sell custom socks', store, {}, () => new Date('2025-03-23T10:00:00.000Z')),
    /disk unavailable/,
  );
});
