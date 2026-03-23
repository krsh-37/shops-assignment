export interface IdeaMemory {
  raw: string;
  normalized: string;
}

export interface ResearchReport {
  competitors: string[];
  market_size_inr: string;
  whitespace: string;
  keywords: {
    primary: string[];
    secondary: string[];
  };
  india_insight: string;
}

export interface VisualConcept {
  name: string;
  mood: string;
  prompt: string;
}

export interface VisualMemory {
  brand_name: string;
  logo_concepts: [VisualConcept, VisualConcept, VisualConcept];
  chosen_concept: number;
  palette: string[];
  font_pairing: string;
  mood: string;
}

export interface DomainCandidate {
  domain: string;
  available: boolean;
  price: number;
  reason: string;
}

export interface DomainMemory {
  recommended: string;
  top5: [DomainCandidate, DomainCandidate, DomainCandidate, DomainCandidate, DomainCandidate];
}

export interface AuditLogEntry {
  agent: string;
  action: string;
  timestamp: string;
  keys_written: string[];
}

export interface RunMemorySchema {
  idea: IdeaMemory;
  research: ResearchReport;
  visual: VisualMemory;
  domains: DomainMemory;
  audit_log: AuditLogEntry[];
}

export type RunMemoryKey = keyof RunMemorySchema;

export class MissingRunIdError extends Error {
  constructor(message = 'Run ID is required for memory operations.') {
    super(message);
    this.name = 'MissingRunIdError';
  }
}

export class CrossRunMemoryAccessError extends Error {
  constructor(message = 'Cross-run memory access is not allowed.') {
    super(message);
    this.name = 'CrossRunMemoryAccessError';
  }
}

export class MissingMemoryValueError extends Error {
  constructor(message = 'Requested memory value is not available.') {
    super(message);
    this.name = 'MissingMemoryValueError';
  }
}

export class InvalidMemoryValueError extends Error {
  constructor(message = 'Memory value does not match the approved schema.') {
    super(message);
    this.name = 'InvalidMemoryValueError';
  }
}

export interface RunMemoryBacking {
  runs: Map<string, Partial<RunMemorySchema>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isIdeaMemory(value: unknown): value is IdeaMemory {
  return isRecord(value) && typeof value.raw === 'string' && typeof value.normalized === 'string';
}

function isResearchReport(value: unknown): value is ResearchReport {
  return (
    isRecord(value) &&
    isStringArray(value.competitors) &&
    typeof value.market_size_inr === 'string' &&
    typeof value.whitespace === 'string' &&
    isRecord(value.keywords) &&
    isStringArray(value.keywords.primary) &&
    isStringArray(value.keywords.secondary) &&
    typeof value.india_insight === 'string'
  );
}

function isVisualConcept(value: unknown): value is VisualConcept {
  return isRecord(value) && typeof value.name === 'string' && typeof value.mood === 'string' && typeof value.prompt === 'string';
}

function isVisualMemory(value: unknown): value is VisualMemory {
  return (
    isRecord(value) &&
    typeof value.brand_name === 'string' &&
    Array.isArray(value.logo_concepts) &&
    value.logo_concepts.length === 3 &&
    value.logo_concepts.every(isVisualConcept) &&
    typeof value.chosen_concept === 'number' &&
    Array.isArray(value.palette) &&
    value.palette.every((item) => typeof item === 'string') &&
    typeof value.font_pairing === 'string' &&
    typeof value.mood === 'string'
  );
}

function isDomainCandidate(value: unknown): value is DomainCandidate {
  return (
    isRecord(value) &&
    typeof value.domain === 'string' &&
    typeof value.available === 'boolean' &&
    typeof value.price === 'number' &&
    typeof value.reason === 'string'
  );
}

function isDomainMemory(value: unknown): value is DomainMemory {
  return (
    isRecord(value) &&
    typeof value.recommended === 'string' &&
    Array.isArray(value.top5) &&
    value.top5.length === 5 &&
    value.top5.every(isDomainCandidate)
  );
}

function isAuditLogEntry(value: unknown): value is AuditLogEntry {
  return (
    isRecord(value) &&
    typeof value.agent === 'string' &&
    typeof value.action === 'string' &&
    typeof value.timestamp === 'string' &&
    isStringArray(value.keys_written)
  );
}

function isAuditLog(value: unknown): value is AuditLogEntry[] {
  return Array.isArray(value) && value.every(isAuditLogEntry);
}

function isValidRunMemoryValue(key: RunMemoryKey, value: unknown): value is RunMemorySchema[RunMemoryKey] {
  switch (key) {
    case 'idea':
      return isIdeaMemory(value);
    case 'research':
      return isResearchReport(value);
    case 'visual':
      return isVisualMemory(value);
    case 'domains':
      return isDomainMemory(value);
    case 'audit_log':
      return isAuditLog(value);
  }
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

// Implements PRD-003 and PRD-NFR-002
export class InMemoryRunScopedMemoryStore {
  private readonly backing: RunMemoryBacking;

  private readonly activeRunId: string;

  constructor(activeRunId: string, backing: RunMemoryBacking = { runs: new Map() }) {
    this.activeRunId = activeRunId;
    this.backing = backing;
  }

  async write<K extends RunMemoryKey>(runId: string | undefined, key: K, value: RunMemorySchema[K]): Promise<void> {
    this.assertActiveRun(runId);
    if (!isValidRunMemoryValue(key, value)) {
      throw new InvalidMemoryValueError();
    }

    const existing = this.backing.runs.get(this.activeRunId) ?? {};
    this.backing.runs.set(this.activeRunId, { ...existing, [key]: cloneValue(value) });
  }

  async read<K extends RunMemoryKey>(runId: string | undefined, key: K): Promise<RunMemorySchema[K]> {
    this.assertActiveRun(runId);

    const record = this.backing.runs.get(this.activeRunId);
    if (!record || record[key] === undefined) {
      throw new MissingMemoryValueError();
    }

    return cloneValue(record[key] as RunMemorySchema[K]);
  }

  private assertActiveRun(runId: string | undefined): void {
    if (typeof runId !== 'string' || runId.trim().length === 0) {
      throw new MissingRunIdError();
    }

    if (runId !== this.activeRunId) {
      throw new CrossRunMemoryAccessError();
    }
  }
}

export function createInMemoryRunScopedMemoryStore(runId: string, backing?: RunMemoryBacking): InMemoryRunScopedMemoryStore {
  return new InMemoryRunScopedMemoryStore(runId, backing);
}

export function createRunMemoryBacking(): RunMemoryBacking {
  return { runs: new Map() };
}
