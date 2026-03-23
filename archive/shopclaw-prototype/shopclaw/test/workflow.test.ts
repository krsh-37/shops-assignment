import assert from 'node:assert/strict';
import test from 'node:test';
import { runLaunchWorkflow } from '../mastra/workflows/openclaw.ts';

function createDeferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });

  return { promise, resolve };
}

test('workflow starts research and domain in parallel', async () => {
  const research = createDeferred();
  const domain = createDeferred();
  const started: string[] = [];

  const workflow = runLaunchWorkflow(
    {
      research: async () => {
        started.push('research');
        await research.promise;
      },
      domain: async () => {
        started.push('domain');
        await domain.promise;
      },
    },
    { gtmComplete: false },
  );

  assert.deepEqual(started.slice(0, 2).sort(), ['domain', 'research']);

  research.resolve();
  domain.resolve();

  const state = await workflow;
  assert.deepEqual(state.startedSteps.slice(0, 2).sort(), ['domain', 'research']);
  assert.equal(state.steps.research, 'completed');
  assert.equal(state.steps.domain, 'completed');
});

test('workflow blocks visual until research completes', async () => {
  const research = createDeferred();
  const domain = createDeferred();
  const started: string[] = [];

  const workflow = runLaunchWorkflow(
    {
      research: async () => {
        started.push('research');
        await research.promise;
      },
      domain: async () => {
        started.push('domain');
        await domain.promise;
      },
      visual: async () => {
        started.push('visual');
      },
    },
    { gtmComplete: false },
  );

  assert.deepEqual(started, ['research', 'domain']);

  research.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(started.includes('visual'), true);

  domain.resolve();
  const state = await workflow;
  assert.equal(state.steps.visual, 'completed');
  assert.equal(state.steps.shopify, 'pending');
});

test('workflow keeps shopify pending until GTM is complete', async () => {
  const research = createDeferred();
  const domain = createDeferred();
  const started: string[] = [];

  const workflow = runLaunchWorkflow(
    {
      research: async () => {
        started.push('research');
        await research.promise;
      },
      domain: async () => {
        started.push('domain');
        await domain.promise;
      },
      visual: async () => {
        started.push('visual');
      },
      shopify: async () => {
        started.push('shopify');
      },
    },
    { gtmComplete: false },
  );

  research.resolve();
  domain.resolve();

  const state = await workflow;
  assert.equal(started.includes('shopify'), false);
  assert.equal(state.steps.shopify, 'pending');
  assert.equal(state.pendingSteps.includes('shopify'), true);
});
