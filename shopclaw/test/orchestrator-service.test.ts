import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaunchStatus } from '../src/mastra/services/openclaw-launch-service.js';
import { handleOrchestratorMessage } from '../src/mastra/services/openclaw-orchestrator-service.js';
import type { ClarificationPrompt } from '../src/mastra/domain/openclaw/schemas.js';
import { sampleIdea } from './test-helpers.js';

test('orchestrator message starts a launch and returns a clarification batch', async () => {
  const result = await handleOrchestratorMessage({ message: sampleIdea });

  assert.equal(result.control.phase, 'clarification');
  assert.equal(result.control.next_action, 'answer-clarifications');
  assert.equal(result.control.pending_questions?.length, 3);
});

test('orchestrator message handles clarification answers and returns visual selection', async () => {
  const started = await handleOrchestratorMessage({ message: sampleIdea });
  const launchId = started.control.launchId;
  const answers = started.control.pending_questions?.map((question: ClarificationPrompt) => question.assumption ?? 'Founder answer') ?? [];

  await handleOrchestratorMessage({
    launchId,
    answers,
  });

  let status = getLaunchStatus(launchId);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (status.phase === 'visual-selection') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    status = getLaunchStatus(launchId);
  }

  assert.equal(status.phase, 'visual-selection');
  assert.equal(status.next_action, 'select-visual-concept');
  assert.equal(status.visual_concepts?.length, 3);
});
