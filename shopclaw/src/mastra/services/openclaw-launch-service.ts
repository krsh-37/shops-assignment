import { randomUUID } from 'node:crypto';
import { mem0 } from '../memory/mem0.js';
import { internalOpenclawWorkflow } from '../workflows/openclaw.js';

function normalizeWorkflowError(result: { status: string; error?: unknown }) {
  return result.status === 'failed' ? result.error : new Error(`Workflow status ${result.status}`);
}

export async function runLaunch(idea: string, launchId = randomUUID()) {
  mem0.ensureRun(idea, launchId);
  const run = await internalOpenclawWorkflow.createRun();
  const result = await run.start({
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

  return mem0.requireRun(launchId);
}

export function startLaunch(idea: string) {
  const launchId = randomUUID();
  mem0.ensureRun(idea, launchId);

  void internalOpenclawWorkflow
    .createRun()
    .then(async internalRun => {
      const result = await internalRun.start({
        inputData: {
          launchId,
          idea,
        },
      });

      if (result.status !== 'success') {
        mem0.failRun(launchId, normalizeWorkflowError(result));
      }
    })
    .catch(error => {
      mem0.failRun(launchId, error);
    });

  return mem0.requireRun(launchId);
}

export function getLaunchRun(launchId: string) {
  return mem0.getRun(launchId);
}
