import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestratorAgent } from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { mem0 } from '../src/mastra/memory/mem0.js';
import { askUserTool } from '../src/mastra/tools/ask-user-tool.js';
import { delegateToAgentTool } from '../src/mastra/tools/delegate-to-agent-tool.js';
import { getLaunchStatusTool } from '../src/mastra/tools/get-launch-status-tool.js';
import { resumeLaunchWorkflowTool } from '../src/mastra/tools/resume-launch-workflow-tool.js';
import { selectVisualConceptTool } from '../src/mastra/tools/select-visual-concept-tool.js';
import { startLaunchWorkflowTool } from '../src/mastra/tools/start-launch-workflow-tool.js';
import { sampleIdea } from './test-helpers.js';

test('orchestrator exposes the required orchestration tools', async () => {
  const tools = await orchestratorAgent.listTools();

  assert.ok('askUserTool' in tools);
  assert.ok('delegateToAgentTool' in tools);
  assert.ok('mem0ReadTool' in tools);
  assert.ok('mem0WriteTool' in tools);
  assert.ok('startLaunchWorkflowTool' in tools);
  assert.ok('resumeLaunchWorkflowTool' in tools);
  assert.ok('selectVisualConceptTool' in tools);
  assert.ok('getLaunchStatusTool' in tools);
});

test('orchestrator exposes specialist subagents', async () => {
  const agents = await orchestratorAgent.listAgents();

  assert.ok('researchAgent' in agents);
  assert.ok('domainAgent' in agents);
  assert.ok('visualAgent' in agents);
  assert.ok('gtmAgent' in agents);
  assert.ok('shopifyAgent' in agents);
  assert.ok('adsAgent' in agents);
  assert.ok('seoAgent' in agents);
  assert.ok('launchReportAgent' in agents);
});

test('orchestrator workflow exposure is mode-aware', async () => {
  const workflows = await orchestratorAgent.listWorkflows();

  assert.equal('openclawWorkflow' in workflows, isDevMode());
});

test('ask user tool persists clarification requests on the launch run', async () => {
  const run = mem0.createRun(sampleIdea);
  const output = await (askUserTool.execute as any)(
    {
      launchId: run.id,
      questions: [
        {
          id: 'first-customer',
          question: 'Who is the first paying customer?',
          rationale: 'Need the ICP before running GTM.',
          target_sections: ['brief', 'gtm'],
        },
        {
          id: 'launch-city',
          question: 'Which city launches first?',
          rationale: 'Need launch geography before ads and SEO.',
          target_sections: ['brief', 'ads', 'seo'],
        },
      ],
      reason: 'Need GTM assumptions before running specialist agents.',
    },
    {},
  );

  const updated = mem0.requireRun(run.id);

  assert.equal(output.status, 'awaiting-user-input');
  assert.equal(output.reason, 'Need GTM assumptions before running specialist agents.');
  assert.deepEqual(
    updated.pendingQuestions.map(question => question.question),
    ['Who is the first paying customer?', 'Which city launches first?'],
  );
  assert.equal(updated.pendingReason, 'Need GTM assumptions before running specialist agents.');
  assert.equal(updated.status, 'awaiting-user-input');
});

test('delegate tool records the target agent on the launch run', async () => {
  const run = mem0.createRun(sampleIdea);
  const output = await (delegateToAgentTool.execute as any)(
    {
      launchId: run.id,
      agentId: 'research-agent',
      task: 'Find direct and adjacent competitors in India.',
    },
    {},
  );

  const updated = mem0.requireRun(run.id);

  assert.equal(output.delegated, true);
  assert.equal(updated.currentAgent, 'research-agent');
  assert.equal(/delegate:research-agent/.test(updated.memory.audit_log.at(-1)?.action ?? ''), false);
});

test('resume workflow tool stores answers and starts the launch', async () => {
  const { startLaunch } = await import('../src/mastra/services/openclaw-launch-service.js');
  const run = await startLaunch(sampleIdea);
  const expectedAnswers = run.pendingQuestions.map(question => question.assumption ?? 'Founder answer');

  const output = await (resumeLaunchWorkflowTool.execute as any)(
    {
      launchId: run.id,
      answers: expectedAnswers,
    },
    {},
  );

  assert.equal(output.launchId, run.id);
  assert.deepEqual(output.answers, expectedAnswers);

  let resolved = mem0.requireRun(run.id);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (resolved.phase === 'visual-selection') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    resolved = mem0.requireRun(run.id);
  }

  assert.equal(resolved.status, 'awaiting-user-input');
  assert.equal(resolved.phase, 'visual-selection');
  assert.deepEqual(resolved.clarificationAnswers, expectedAnswers);
  assert.deepEqual(resolved.memory.idea?.clarification_answers, expectedAnswers);
  assert.equal(resolved.memory.brief?.answers[0]?.answer, expectedAnswers[0] ?? 'Founder answer');
  assert.equal(resolved.memory.visual?.logo_concepts.length, 3);
});

test('orchestrator control tools resolve the active launch from thread context', async () => {
  const threadId = 'studio-thread-1';

  const started = await (startLaunchWorkflowTool.execute as any)(
    { idea: sampleIdea },
    {
      agent: {
        threadId,
      },
    },
  );

  assert.equal(started.launchId.length > 0, true);
  assert.equal(started.phase, 'clarification');

  const resumed = await (resumeLaunchWorkflowTool.execute as any)(
    {
      launchId: '',
      answers: started.pending_questions.map((question: { assumption?: string }) => question.assumption ?? 'Founder answer'),
    },
    {
      agent: {
        threadId,
      },
    },
  );

  let status = resumed;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (status.phase === 'visual-selection') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    status = await (getLaunchStatusTool.execute as any)(
      { launchId: '' },
      {
        agent: {
          threadId,
        },
      },
    );
  }

  assert.equal(status.phase, 'visual-selection');
  assert.equal(status.visual_concepts.length, 3);

  await (selectVisualConceptTool.execute as any)(
    { launchId: '', conceptIndex: 1 },
    {
      agent: {
        threadId,
      },
    },
  );

  let completed = await (getLaunchStatusTool.execute as any)(
    { launchId: '' },
    {
      agent: {
        threadId,
      },
    },
  );

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (completed.status === 'completed') {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    completed = await (getLaunchStatusTool.execute as any)(
      { launchId: '' },
      {
        agent: {
          threadId,
        },
      },
    );
  }

  assert.equal(completed.status, 'completed');
  assert.equal(completed.selected_visual_concept, 1);
});
