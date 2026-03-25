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

export interface Mem0Client {
  add(messages: Mem0Message[], userId: string, metadata?: Record<string, unknown>): Promise<void>;
  search(query: string, userId: string, topK?: number): Promise<Mem0SearchResult[]>;
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

  async add(messages: Mem0Message[], userId: string, metadata: Record<string, unknown> = {}): Promise<void> {
    await this.client.add(messages, {
      version: 'v2',
      user_id: userId,
      run_id: userId,
      metadata,
      output_format: 'v1.1',
    });
  }

  async search(query: string, userId: string, topK = 5): Promise<Mem0SearchResult[]> {
    const results = await this.client.search(query, {
      version: 'v2',
      user_id: userId,
      run_id: userId,
      top_k: topK,
    });

    return results.map(result => ({
      id: result.id,
      memory: result.memory ?? result.data?.memory ?? '',
      score: result.score,
      metadata: result.metadata ?? undefined,
    }));
  }
}

class StubMem0Client implements Mem0Client {
  async add(): Promise<void> {
    return;
  }

  async search(query: string): Promise<Mem0SearchResult[]> {
    return [
      {
        id: 'stub-memory',
        memory: `Stub memory context for query: ${query}`,
        score: 1,
      },
    ];
  }
}

export function getMem0Client(): Mem0Client {
  return isDevMode() ? new RemoteMem0Client() : new StubMem0Client();
}
