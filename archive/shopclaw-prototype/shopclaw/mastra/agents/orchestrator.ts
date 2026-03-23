import type { LaunchRunRecord, LaunchRunStore } from '../tools/launch-run.ts';
import { startLaunchRun } from '../tools/launch-run.ts';

export interface LaunchClarificationInput {
  targetCities?: string;
  pricePoint?: string;
  channelStrategy?: string;
}

export interface ClarificationQuestion {
  key: keyof LaunchClarificationInput;
  question: string;
}

export type LaunchOrchestratorStatus = 'paused' | 'ready';

export interface LaunchOrchestratorResult {
  run: LaunchRunRecord;
  status: LaunchOrchestratorStatus;
  questions: ClarificationQuestion[];
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

function getMissingQuestions(input: LaunchClarificationInput): ClarificationQuestion[] {
  return REQUIRED_QUESTIONS.filter(({ key }) => !hasAnsweredValue(input[key]));
}

// Implements PRD-002
export async function orchestrateLaunchRun(
  prompt: unknown,
  store: LaunchRunStore,
  clarification: LaunchClarificationInput = {},
  startDownstreamWork: (run: LaunchRunRecord) => Promise<void> = async () => {},
  now: () => Date = () => new Date(),
): Promise<LaunchOrchestratorResult> {
  const run = await startLaunchRun(prompt, store, now);
  const questions = getMissingQuestions(clarification);

  if (questions.length > 0) {
    const pausedRun: LaunchRunRecord = {
      ...run,
      status: 'paused',
      updatedAt: now().toISOString(),
    };
    await store.save(pausedRun);
    return { run: pausedRun, status: 'paused', questions };
  }

  const readyRun: LaunchRunRecord = {
    ...run,
    status: 'ready',
    updatedAt: now().toISOString(),
  };
  await store.save(readyRun);
  await startDownstreamWork(readyRun);
  return { run: readyRun, status: 'ready', questions: [] };
}
