import { randomUUID } from 'node:crypto';
import { createEmptyMemory, type LaunchBible, type LaunchRun, type OpenClawMemory } from '../domain/openclaw/schemas.js';

type WritableSection = Exclude<keyof OpenClawMemory, 'audit_log'>;

function nowIso(): string {
  return new Date().toISOString();
}

export class OpenClawMem0 {
  private readonly runs = new Map<string, LaunchRun>();

  createRun(idea: string, launchId = randomUUID()): LaunchRun {
    const timestamp = nowIso();
    const run: LaunchRun = {
      id: launchId,
      idea,
      status: 'queued',
      currentAgent: null,
      completedAgents: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      memory: createEmptyMemory(),
      report: null,
      error: null,
    };

    this.runs.set(launchId, run);
    return run;
  }

  getRun(launchId: string): LaunchRun | undefined {
    return this.runs.get(launchId);
  }

  requireRun(launchId: string): LaunchRun {
    const run = this.getRun(launchId);
    if (!run) {
      throw new Error(`Launch run ${launchId} was not found.`);
    }
    return run;
  }

  read(launchId: string): OpenClawMemory {
    return this.requireRun(launchId).memory;
  }

  write<TKey extends WritableSection>(
    launchId: string,
    key: TKey,
    value: OpenClawMemory[TKey],
    agent: string,
    action = `write:${key}`,
  ): LaunchRun {
    const run = this.requireRun(launchId);
    run.memory[key] = value;
    this.appendAuditLog(launchId, agent, action, [String(key)]);
    run.updatedAt = nowIso();
    return run;
  }

  appendAuditLog(launchId: string, agent: string, action: string, keysWritten: string[]): LaunchRun {
    const run = this.requireRun(launchId);
    run.memory.audit_log.push({
      agent,
      action,
      timestamp: nowIso(),
      keys_written: keysWritten,
    });
    run.updatedAt = nowIso();
    return run;
  }

  updateStatus(launchId: string, currentAgent: string): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'running';
    run.currentAgent = currentAgent;
    run.updatedAt = nowIso();
    return run;
  }

  markAgentCompleted(launchId: string, agent: string): LaunchRun {
    const run = this.requireRun(launchId);
    if (!run.completedAgents.includes(agent)) {
      run.completedAgents.push(agent);
    }
    run.updatedAt = nowIso();
    return run;
  }

  completeRun(launchId: string, report: LaunchBible): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'completed';
    run.currentAgent = 'launch-report-agent';
    run.report = report;
    this.appendAuditLog(launchId, 'launch-report-agent', 'complete-launch', ['report']);
    this.markAgentCompleted(launchId, 'launch-report-agent');
    run.updatedAt = nowIso();
    return run;
  }

  failRun(launchId: string, error: unknown): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'failed';
    run.error = error instanceof Error ? error.message : String(error);
    run.updatedAt = nowIso();
    return run;
  }
}

export const mem0 = new OpenClawMem0();
