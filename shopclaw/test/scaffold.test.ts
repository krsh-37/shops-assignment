import assert from 'node:assert/strict';
import test from 'node:test';
import { openClawMemorySchema } from '../mastra/memory/mem0.js';

test('phase 00 scaffold memory schema accepts an empty default payload', () => {
  const result = openClawMemorySchema.safeParse({});
  assert.equal(result.success, true);
});
