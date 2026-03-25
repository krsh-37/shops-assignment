import { randomUUID } from 'node:crypto';
import { buildFounderBrief, collectLaunchClarifications, generateBrandCandidates, inferCategory, normalizeClarificationAnswers } from '../domain/openclaw/content.js';
import { mem0 } from '../memory/mem0.js';
import { postVisualOpenclawWorkflow, preVisualOpenclawWorkflow } from '../workflows/openclaw.js';

type PendingPhase = 'clarification' | 'visual-selection';

function normalizeWorkflowError(result: { status: string; error?: unknown }) {
  return result.status === 'failed' ? result.error : new Error(`Workflow status ${result.status}`);
}

function normalizeLaunchId(launchId: string | undefined): string | undefined {
  const normalized = launchId?.trim();
  return normalized ? normalized : undefined;
}

function resolveActiveLaunchId(launchId: string | undefined, phase?: PendingPhase, threadId?: string): string {
  const normalized = normalizeLaunchId(launchId);
  if (normalized) {
    mem0.requireRun(normalized);
    return normalized;
  }

  const normalizedThreadId = normalizeLaunchId(threadId);
  if (normalizedThreadId) {
    const threadMatch = phase
      ? mem0.getActiveLaunchForThread(normalizedThreadId, phase)
      : mem0.getActiveLaunchForThread(normalizedThreadId) ?? mem0.getLatestLaunchForThread(normalizedThreadId);
    if (threadMatch) {
      return threadMatch.id;
    }

    const qualifier = phase ? ` in ${phase} phase` : '';
    throw new Error(`No active launch run was found for this chat thread${qualifier}. Start a launch first in the same thread.`);
  }

  const matches = mem0.findRuns(run => {
    if (phase) {
      return run.phase === phase && run.status === 'awaiting-user-input';
    }

    return run.status === 'awaiting-user-input' || run.status === 'running' || run.status === 'queued';
  });

  if (matches.length === 0) {
    const qualifier = phase ? ` in ${phase} phase` : '';
    throw new Error(`No active launch run was found${qualifier}. Start a launch first or provide a launchId.`);
  }

  if (matches.length > 1) {
    const qualifier = phase ? ` in ${phase} phase` : '';
    throw new Error(`Multiple active launch runs were found${qualifier}. Provide a launchId explicitly.`);
  }

  return matches[0]!.id;
}

async function startInternalLaunch(launchId: string, idea: string) {
  const internalRun = await preVisualOpenclawWorkflow.createRun({
    runId: launchId,
    resourceId: `launch-${launchId}`,
  });
  const result = await internalRun.start({
    inputData: {
      launchId,
      idea,
    },
  });

  if (result.status !== 'success') {
    const error = normalizeWorkflowError(result);
    mem0.failRun(launchId, error);
    throw error instanceof Error ? error : new Error(String(error));
  }

  if (mem0.requireRun(launchId).selectedVisualConcept === null) {
    mem0.requestVisualSelection(launchId);
  }

  return result;
}

async function continueInternalLaunch(launchId: string) {
  const internalRun = await postVisualOpenclawWorkflow.createRun({
    runId: `${launchId}:post-visual`,
    resourceId: `launch-${launchId}`,
  });
  const result = await internalRun.start({
    inputData: {
      launchId,
    },
  });

  if (result.status !== 'success') {
    const error = normalizeWorkflowError(result);
    mem0.failRun(launchId, error);
    throw error instanceof Error ? error : new Error(String(error));
  }

  return result;
}

function toWorkflowControl(run: ReturnType<typeof mem0.requireRun>) {
  return {
    launchId: run.id,
    status: run.status,
    phase: run.phase,
    current_agent: run.currentAgent,
    completed_agents: run.completedAgents,
    pending_questions: run.pendingQuestions,
    pending_reason: run.pendingReason,
    answers: run.clarificationAnswers,
    selected_visual_concept: run.selectedVisualConcept,
    visual_concepts: run.memory.visual?.logo_concepts,
    error: run.error,
    report_summary: run.report?.brand.summary,
    next_action:
      run.phase === 'clarification'
        ? 'answer-clarifications'
        : run.phase === 'visual-selection'
          ? 'select-visual-concept'
          : run.status === 'completed'
            ? 'view-launch-bible'
            : undefined,
  };
}

export async function runLaunch(idea: string, launchId = randomUUID()) {
  const run = await startLaunch(idea, launchId);
  const normalizedAnswers = normalizeClarificationAnswers(
    run.pendingQuestions,
    run.pendingQuestions.map(question => question.assumption ?? 'Founder answer required.'),
  );
  mem0.recordHumanAnswers(
    launchId,
    normalizedAnswers.map(answer => answer.answer),
    normalizedAnswers,
  );
  await startInternalLaunch(launchId, idea);
  mem0.setSelectedVisualConcept(launchId, 0);
  await continueInternalLaunch(launchId);

  return mem0.requireRun(launchId);
}

export async function startLaunch(idea: string, launchId = randomUUID(), threadId?: string) {
  const run = mem0.ensureRun(idea, launchId);
  const normalizedThreadId = normalizeLaunchId(threadId);
  if (normalizedThreadId) {
    mem0.bindThreadToLaunch(launchId, normalizedThreadId);
  }
  const pendingQuestions = collectLaunchClarifications(idea);

  run.memory.idea = {
    raw: idea,
    category: inferCategory(idea),
    brand_name_candidates: generateBrandCandidates(idea),
    clarification_questions: pendingQuestions.map(question => ({
      question: question.question,
      assumption: question.assumption ?? 'Founder answer required.',
    })),
    clarification_answers: [],
  };

  mem0.requestHumanInput(
    launchId,
    pendingQuestions,
    'Collect the founder clarifications before starting the OpenClaw workflow.',
  );

  return mem0.requireRun(launchId);
}

export async function resumeLaunch(launchId: string | undefined, answers: string[], threadId?: string) {
  const resolvedLaunchId = resolveActiveLaunchId(launchId, 'clarification', threadId);
  const run = mem0.requireRun(resolvedLaunchId);
  const prompts = run.questionContext.length > 0 ? run.questionContext : run.pendingQuestions;
  if (prompts.length === 0) {
    return run;
  }
  if (answers.length !== prompts.length) {
    throw new Error(`Launch ${resolvedLaunchId} expects ${prompts.length} answers but received ${answers.length}.`);
  }
  const normalizedAnswers = normalizeClarificationAnswers(prompts, answers);
  const brief = buildFounderBrief(normalizedAnswers);
  mem0.recordHumanAnswers(resolvedLaunchId, answers, normalizedAnswers);
  await mem0.writeSection(resolvedLaunchId, 'brief', brief, 'orchestrator-agent', 'write:brief');
  mem0.updateStatus(resolvedLaunchId, 'orchestrator-agent');

  await startInternalLaunch(resolvedLaunchId, run.idea);

  return mem0.requireRun(resolvedLaunchId);
}

export async function selectVisualConcept(launchId: string | undefined, conceptIndex: number, threadId?: string) {
  const resolvedLaunchId = resolveActiveLaunchId(launchId, 'visual-selection', threadId);
  const run = mem0.requireRun(resolvedLaunchId);
  if (!run.memory.visual) {
    throw new Error(`Launch ${resolvedLaunchId} does not have visual concepts available for selection yet.`);
  }
  if (run.phase !== 'visual-selection') {
    return run;
  }

  mem0.setSelectedVisualConcept(resolvedLaunchId, conceptIndex);

  await continueInternalLaunch(resolvedLaunchId);

  return mem0.requireRun(resolvedLaunchId);
}

export function getLaunchRun(launchId: string | undefined) {
  const normalized = normalizeLaunchId(launchId);
  return normalized ? mem0.getRun(normalized) : undefined;
}

export function getLaunchStatus(launchId: string | undefined, threadId?: string) {
  const resolvedLaunchId = resolveActiveLaunchId(launchId, undefined, threadId);
  return toWorkflowControl(mem0.requireRun(resolvedLaunchId));
}
