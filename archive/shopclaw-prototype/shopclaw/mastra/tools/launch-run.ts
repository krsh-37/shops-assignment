import { randomUUID } from 'node:crypto';

export type LaunchRunStatus = 'initialized' | 'paused' | 'ready';

export interface LaunchRunRecord {
  runId: string;
  prompt: string;
  status: LaunchRunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LaunchRunStore {
  save(record: LaunchRunRecord): Promise<void>;
  get(runId: string): Promise<LaunchRunRecord | null>;
}

export class InvalidFounderPromptError extends Error {
  constructor(message = 'Founder prompt must be a non-empty string.') {
    super(message);
    this.name = 'InvalidFounderPromptError';
  }
}

// Implements FRD-002
export class InMemoryLaunchRunStore implements LaunchRunStore {
  private readonly records = new Map<string, LaunchRunRecord>();

  async save(record: LaunchRunRecord): Promise<void> {
    this.records.set(record.runId, record);
  }

  async get(runId: string): Promise<LaunchRunRecord | null> {
    return this.records.get(runId) ?? null;
  }
}

function normalizeFounderPrompt(prompt: unknown): string {
  if (typeof prompt !== 'string') {
    throw new InvalidFounderPromptError();
  }

  const normalized = prompt.trim();
  if (normalized.length === 0) {
    throw new InvalidFounderPromptError();
  }

  return normalized;
}

// Implements FRD-001, FRD-002
export async function startLaunchRun(
  prompt: unknown,
  store: LaunchRunStore,
  now: () => Date = () => new Date(),
): Promise<LaunchRunRecord> {
  const normalizedPrompt = normalizeFounderPrompt(prompt);
  const timestamp = now().toISOString();
  const record: LaunchRunRecord = {
    runId: randomUUID(),
    prompt: normalizedPrompt,
    status: 'initialized',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await store.save(record);
  return record;
}
