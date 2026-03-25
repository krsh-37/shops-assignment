import { randomUUID } from 'node:crypto';
import { buildFounderBrief, collectLaunchClarifications, generateBrandCandidates, inferCategory, normalizeClarificationAnswers } from '../domain/openclaw/content.js';
import { mem0 } from '../memory/mem0.js';
import { internalOpenclawWorkflow } from '../workflows/openclaw.js';

function normalizeWorkflowError(result: { status: string; error?: unknown }) {
  return result.status === 'failed' ? result.error : new Error(`Workflow status ${result.status}`);
}

async function startInternalLaunch(launchId: string, idea: string) {
  const internalRun = await internalOpenclawWorkflow.createRun({
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

  return result;
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

  return mem0.requireRun(launchId);
}

export async function startLaunch(idea: string, launchId = randomUUID()) {
  const run = mem0.ensureRun(idea, launchId);
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

export async function resumeLaunch(launchId: string, answers: string[]) {
  const run = mem0.requireRun(launchId);
  const prompts = run.questionContext.length > 0 ? run.questionContext : run.pendingQuestions;
  if (prompts.length === 0) {
    throw new Error(`Launch ${launchId} has no pending clarification questions to resume.`);
  }
  if (answers.length !== prompts.length) {
    throw new Error(`Launch ${launchId} expects ${prompts.length} answers but received ${answers.length}.`);
  }
  const normalizedAnswers = normalizeClarificationAnswers(prompts, answers);
  const brief = buildFounderBrief(normalizedAnswers);
  mem0.recordHumanAnswers(launchId, answers, normalizedAnswers);
  await mem0.writeSection(launchId, 'brief', brief, 'orchestrator-agent', 'write:brief');
  mem0.updateStatus(launchId, 'orchestrator-agent');

  void startInternalLaunch(launchId, run.idea).catch(error => {
    mem0.failRun(launchId, error);
  });

  return mem0.requireRun(launchId);
}

export function getLaunchRun(launchId: string) {
  return mem0.getRun(launchId);
}
