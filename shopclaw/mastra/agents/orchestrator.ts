import type {
  ClarificationQuestion,
  LaunchClarificationInput,
  LaunchRunRecord,
  LaunchRunStore,
  LaunchRunStatus,
  LaunchStatusEvent,
} from '../tools/launch-run';
import { LaunchRunNotFoundError, startLaunchRun } from '../tools/launch-run.js';

export type { LaunchClarificationInput } from '../tools/launch-run.js';

export interface LaunchOrchestratorResult {
  run: LaunchRunRecord;
  status: Extract<LaunchRunStatus, 'paused' | 'ready'>;
  questions: ClarificationQuestion[];
}

export interface LaunchOrchestratorHooks {
  onStatus?: (event: LaunchStatusEvent, run: LaunchRunRecord) => Promise<void> | void;
  startDownstreamWork?: (run: LaunchRunRecord) => Promise<void>;
}

const REQUIRED_QUESTIONS = [
  {
    key: 'targetCities',
    question: 'What cities in India should we prioritise first?',
  },
  {
    key: 'pricePoint',
    question: "What's the price point you're targeting?",
  },
  {
    key: 'channelStrategy',
    question: 'Direct-to-consumer only, or open to quick-commerce channels?',
  },
] satisfies readonly ClarificationQuestion[];

function hasAnsweredValue(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasAnsweredValue(item));
  }

  return value !== undefined && value !== null;
}

export function collectClarificationQuestions(input: LaunchClarificationInput): ClarificationQuestion[] {
  return REQUIRED_QUESTIONS.filter(({ key }) => !hasAnsweredValue(input[key]));
}

async function publishRunStatus(
  store: LaunchRunStore,
  run: LaunchRunRecord,
  status: LaunchRunStatus,
  message: string,
  now: () => Date,
  hooks: LaunchOrchestratorHooks,
  details?: Record<string, unknown>,
): Promise<LaunchRunRecord> {
  const timestamp = now().toISOString();
  const event: LaunchStatusEvent = {
    actor: 'orchestrator',
    status,
    message,
    timestamp,
    details,
  };

  const nextRun: LaunchRunRecord = {
    ...run,
    status,
    updatedAt: timestamp,
    statusHistory: [...run.statusHistory, event],
  };

  await store.save(nextRun);
  await hooks.onStatus?.(event, nextRun);
  return nextRun;
}

export async function orchestrateLaunchRun(
  prompt: unknown,
  store: LaunchRunStore,
  clarification: LaunchClarificationInput = {},
  now: () => Date = () => new Date(),
  hooks: LaunchOrchestratorHooks = {},
): Promise<LaunchOrchestratorResult> {
  let run = await startLaunchRun(prompt, store, clarification, now);

  run = await publishRunStatus(
    store,
    run,
    'initialized',
    'Launch run created from founder prompt.',
    now,
    hooks,
    { promptLength: run.prompt.length },
  );

  return await advanceLaunchRun(run, store, clarification, now, hooks);
}

export async function resumeLaunchRun(
  runId: string,
  store: LaunchRunStore,
  clarificationPatch: LaunchClarificationInput,
  now: () => Date = () => new Date(),
  hooks: LaunchOrchestratorHooks = {},
): Promise<LaunchOrchestratorResult> {
  const existingRun = await store.get(runId);
  if (!existingRun) {
    throw new LaunchRunNotFoundError(runId);
  }

  const mergedClarification: LaunchClarificationInput = {
    ...existingRun.clarification,
    ...clarificationPatch,
  };

  const preparedRun: LaunchRunRecord = {
    ...existingRun,
    clarification: mergedClarification,
  };

  return await advanceLaunchRun(preparedRun, store, mergedClarification, now, hooks);
}

async function advanceLaunchRun(
  run: LaunchRunRecord,
  store: LaunchRunStore,
  clarification: LaunchClarificationInput,
  now: () => Date,
  hooks: LaunchOrchestratorHooks,
): Promise<LaunchOrchestratorResult> {
  const questions = collectClarificationQuestions(clarification);

  if (questions.length > 0) {
    const pausedRun = await publishRunStatus(
      store,
      {
        ...run,
        clarification,
        pendingQuestions: questions,
        downstreamAgentsStarted: false,
      },
      'paused',
      'Clarification is incomplete. Downstream agents remain blocked.',
      now,
      hooks,
      {
        missingKeys: questions.map(({ key }) => key),
      },
    );

    return { run: pausedRun, status: 'paused', questions };
  }

  let readyRun = await publishRunStatus(
    store,
    {
      ...run,
      clarification,
      pendingQuestions: [],
      downstreamAgentsStarted: false,
    },
    'ready',
    'Clarification complete. Run is ready for downstream execution.',
    now,
    hooks,
    {
      answeredKeys: REQUIRED_QUESTIONS.map(({ key }) => key),
    },
  );

  await hooks.startDownstreamWork?.(readyRun);

  readyRun = {
    ...readyRun,
    downstreamAgentsStarted: true,
  };
  await store.save(readyRun);

  return { run: readyRun, status: 'ready', questions: [] };
}
