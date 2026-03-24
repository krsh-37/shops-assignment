import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

export type ClarificationKey = 'targetCities' | 'pricePoint' | 'channelStrategy';

export interface LaunchClarificationInput {
  targetCities?: string;
  pricePoint?: string;
  channelStrategy?: string;
}

export interface ClarificationQuestion {
  key: ClarificationKey;
  question: string;
}

export type LaunchRunStatus = 'initialized' | 'paused' | 'ready' | 'failed';

export interface LaunchStatusEvent {
  actor: 'orchestrator';
  status: LaunchRunStatus;
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface LaunchRunRecord {
  runId: string;
  prompt: string;
  status: LaunchRunStatus;
  clarification: LaunchClarificationInput;
  pendingQuestions: ClarificationQuestion[];
  downstreamAgentsStarted: boolean;
  statusHistory: LaunchStatusEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface LaunchRunStore {
  save(record: LaunchRunRecord): Promise<void>;
  get(runId: string): Promise<LaunchRunRecord | null>;
  list(): Promise<LaunchRunRecord[]>;
}

export class InvalidFounderPromptError extends Error {
  constructor(message = 'Founder prompt must be a non-empty string.') {
    super(message);
    this.name = 'InvalidFounderPromptError';
  }
}

export class LaunchRunNotFoundError extends Error {
  constructor(runId: string) {
    super(`Launch run '${runId}' was not found.`);
    this.name = 'LaunchRunNotFoundError';
  }
}

export class InMemoryLaunchRunStore implements LaunchRunStore {
  private readonly records = new Map<string, LaunchRunRecord>();

  async save(record: LaunchRunRecord): Promise<void> {
    this.records.set(record.runId, structuredClone(record));
  }

  async get(runId: string): Promise<LaunchRunRecord | null> {
    const record = this.records.get(runId);
    return record ? structuredClone(record) : null;
  }

  async list(): Promise<LaunchRunRecord[]> {
    return [...this.records.values()].map((record) => structuredClone(record));
  }
}

export class FileLaunchRunStore implements LaunchRunStore {
  constructor(private readonly filePath = '.mastra/state/launch-runs.json') {}

  async save(record: LaunchRunRecord): Promise<void> {
    const records = await this.readRecords();
    records[record.runId] = record;
    await this.writeRecords(records);
  }

  async get(runId: string): Promise<LaunchRunRecord | null> {
    const records = await this.readRecords();
    return records[runId] ?? null;
  }

  async list(): Promise<LaunchRunRecord[]> {
    const records = await this.readRecords();
    return Object.values(records).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  private async readRecords(): Promise<Record<string, LaunchRunRecord>> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      return JSON.parse(content) as Record<string, LaunchRunRecord>;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        return {};
      }

      throw error;
    }
  }

  private async writeRecords(records: Record<string, LaunchRunRecord>): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    const nextContent = JSON.stringify(records, null, 2);
    const tempFilePath = `${this.filePath}.tmp`;

    await writeFile(tempFilePath, `${nextContent}\n`, 'utf8');
    await rename(tempFilePath, this.filePath);
  }
}

export function normalizeFounderPrompt(prompt: unknown): string {
  if (typeof prompt !== 'string') {
    throw new InvalidFounderPromptError();
  }

  const normalizedPrompt = prompt.trim();
  if (normalizedPrompt.length === 0) {
    throw new InvalidFounderPromptError();
  }

  return normalizedPrompt;
}

export async function startLaunchRun(
  prompt: unknown,
  store: LaunchRunStore,
  clarification: LaunchClarificationInput = {},
  now: () => Date = () => new Date(),
): Promise<LaunchRunRecord> {
  const normalizedPrompt = normalizeFounderPrompt(prompt);
  const timestamp = now().toISOString();
  const record: LaunchRunRecord = {
    runId: randomUUID(),
    prompt: normalizedPrompt,
    status: 'initialized',
    clarification,
    pendingQuestions: [],
    downstreamAgentsStarted: false,
    statusHistory: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await store.save(record);
  return record;
}
