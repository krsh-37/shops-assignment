import { MemoryClient } from 'mem0ai';
import { getOpenClawConfig, isDevMode } from '../config/openclaw-config.js';

type Mem0Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Mem0SearchResult = {
  id: string;
  memory: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

type Mem0Record = {
  id: string;
  memory: string;
  metadata?: Record<string, unknown>;
  messages?: Array<Mem0Message>;
};

export interface Mem0Client {
  add(messages: Mem0Message[], userId: string, runId?: string, metadata?: Record<string, unknown>): Promise<void>;
  search(query: string, userId: string, runId?: string, topK?: number): Promise<Mem0SearchResult[]>;
  getAll(userId: string, runId?: string): Promise<Mem0Record[]>;
}

class RemoteMem0Client implements Mem0Client {
  private clientInstance?: MemoryClient;

  private get client(): MemoryClient {
    if (!this.clientInstance) {
      this.clientInstance = new MemoryClient({
        apiKey: getOpenClawConfig().mem0ApiKey!,
        organizationId: getOpenClawConfig().mem0OrgId,
        projectId: getOpenClawConfig().mem0ProjectId,
      });
    }

    return this.clientInstance;
  }

  async add(messages: Mem0Message[], userId: string, runId?: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.client.add(messages, {
      api_version: 'v2',
      user_id: userId,
      ...(runId ? { run_id: runId } : {}),
      metadata,
      output_format: 'v1.1',
    });
  }

  async search(query: string, userId: string, runId?: string, topK = 5): Promise<Mem0SearchResult[]> {
    const filters = {
      AND: [
        { user_id: userId },
        ...(runId ? [{ run_id: runId }] : []),
      ],
    };

    const results = await this.client.search(query, {
      api_version: 'v2',
      filters,
      top_k: topK,
    });

    return results.map(result => ({
      id: result.id,
      memory: result.memory ?? result.data?.memory ?? '',
      score: result.score,
      metadata: result.metadata ?? undefined,
    }));
  }

  async getAll(userId: string, runId?: string): Promise<Mem0Record[]> {
    const filters = {
      AND: [
        { user_id: userId },
        ...(runId ? [{ run_id: runId }] : []),
      ],
    };

    const results = await this.client.getAll({
      api_version: 'v2',
      filters,
      page_size: 200,
    });

    return results.map(result => ({
      id: result.id,
      memory: result.memory ?? result.data?.memory ?? '',
      metadata: result.metadata ?? undefined,
      messages: Array.isArray(result.messages)
        ? result.messages
            .filter(message => typeof message?.content === 'string' && (message.role === 'user' || message.role === 'assistant'))
            .map(message => ({
              role: message.role,
              content: message.content as string,
            }))
        : undefined,
    }));
  }
}

class StubMem0Client implements Mem0Client {
  private readonly records = new Map<string, Mem0Record[]>();

  async add(messages: Mem0Message[], userId: string, runId?: string, metadata: Record<string, unknown> = {}): Promise<void> {
    const existing = this.records.get(userId) ?? [];
    existing.push({
      id: `stub-${existing.length + 1}`,
      memory: typeof messages[0]?.content === 'string' ? messages[0].content : '',
      metadata: {
        ...metadata,
        ...(runId ? { run_id: runId } : {}),
      },
      messages,
    });
    this.records.set(userId, existing);
    return;
  }

  async search(query: string, userId: string, runId?: string): Promise<Mem0SearchResult[]> {
    const haystack = (this.records.get(userId) ?? []).filter(record => !runId || record.metadata?.run_id === runId);
    const matches = haystack.filter(record => record.memory.toLowerCase().includes(query.toLowerCase()) || query.length > 0);
    return matches.map(record => ({
      id: record.id,
      memory: record.memory,
      score: 1,
      metadata: record.metadata,
    }));
  }

  async getAll(userId: string, runId?: string): Promise<Mem0Record[]> {
    return [...(this.records.get(userId) ?? [])].filter(record => !runId || record.metadata?.run_id === runId);
  }
}

export function getMem0Client(): Mem0Client {
  return isDevMode() ? new RemoteMem0Client() : new StubMem0Client();
}
