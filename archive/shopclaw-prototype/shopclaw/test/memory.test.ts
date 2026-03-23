import assert from 'node:assert/strict';
import test from 'node:test';
import { CrossRunMemoryAccessError, InMemoryRunScopedMemoryStore, InvalidMemoryValueError, MissingMemoryValueError, MissingRunIdError, createRunMemoryBacking } from '../mastra/memory/mem0.ts';

test('memory store writes and reads values only for the active run', async () => {
  const backing = createRunMemoryBacking();
  const store = new InMemoryRunScopedMemoryStore('run-1', backing);

  await store.write('run-1', 'idea', { raw: 'Custom socks', normalized: 'Custom socks' });

  await assert.deepEqual(await store.read('run-1', 'idea'), { raw: 'Custom socks', normalized: 'Custom socks' });
});

test('memory store rejects invalid schema writes', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  await assert.rejects(
    store.write('run-1', 'research', {
      competitors: [],
      market_size_inr: 123,
    } as never),
    InvalidMemoryValueError,
  );
});

test('memory store blocks cross-run reads', async () => {
  const backing = createRunMemoryBacking();
  const run1Store = new InMemoryRunScopedMemoryStore('run-1', backing);
  const run2Store = new InMemoryRunScopedMemoryStore('run-2', backing);

  await run1Store.write('run-1', 'idea', { raw: 'Custom socks', normalized: 'Custom socks' });

  await assert.rejects(run2Store.read('run-1', 'idea'), CrossRunMemoryAccessError);
});

test('memory store rejects missing run IDs and missing values', async () => {
  const store = new InMemoryRunScopedMemoryStore('run-1');

  await assert.rejects(store.write(undefined, 'idea', { raw: 'A', normalized: 'A' }), MissingRunIdError);
  await assert.rejects(store.read('run-1', 'research'), MissingMemoryValueError);
});
