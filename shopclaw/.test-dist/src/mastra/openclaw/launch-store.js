import { randomUUID } from 'node:crypto';
import { createEmptyMemory } from './schemas.js';
function nowIso() {
    return new Date().toISOString();
}
export class LaunchStore {
    runs = new Map();
    createRun(idea, launchId = randomUUID()) {
        const timestamp = nowIso();
        const run = {
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
    getRun(launchId) {
        return this.runs.get(launchId);
    }
    requireRun(launchId) {
        const run = this.getRun(launchId);
        if (!run) {
            throw new Error(`Launch run ${launchId} was not found.`);
        }
        return run;
    }
    readMemory(launchId) {
        return this.requireRun(launchId).memory;
    }
    writeSection(launchId, key, value, agent, action = `write:${key}`) {
        const run = this.requireRun(launchId);
        run.memory[key] = value;
        run.memory.audit_log.push({
            agent,
            action,
            timestamp: nowIso(),
            keys_written: [String(key)],
        });
        run.updatedAt = nowIso();
        return run;
    }
    updateStatus(launchId, currentAgent) {
        const run = this.requireRun(launchId);
        run.status = 'running';
        run.currentAgent = currentAgent;
        run.updatedAt = nowIso();
        return run;
    }
    markAgentCompleted(launchId, agent) {
        const run = this.requireRun(launchId);
        if (!run.completedAgents.includes(agent)) {
            run.completedAgents.push(agent);
        }
        run.updatedAt = nowIso();
        return run;
    }
    completeRun(launchId, report) {
        const run = this.requireRun(launchId);
        run.status = 'completed';
        run.currentAgent = 'launch-report-agent';
        run.report = report;
        run.memory.audit_log.push({
            agent: 'launch-report-agent',
            action: 'complete-launch',
            timestamp: nowIso(),
            keys_written: ['report'],
        });
        this.markAgentCompleted(launchId, 'launch-report-agent');
        run.updatedAt = nowIso();
        return run;
    }
    failRun(launchId, error) {
        const run = this.requireRun(launchId);
        run.status = 'failed';
        run.error = error instanceof Error ? error.message : String(error);
        run.updatedAt = nowIso();
        return run;
    }
}
export const launchStore = new LaunchStore();
