import { randomUUID } from 'node:crypto';
import { launchStore } from './launch-store.js';
import { openclawWorkflow } from './workflow.js';
export async function runLaunch(idea, launchId = randomUUID()) {
    launchStore.createRun(idea, launchId);
    const run = await openclawWorkflow.createRun();
    const result = await run.start({
        inputData: {
            launchId,
            idea,
        },
    });
    if (result.status !== 'success') {
        const error = result.status === 'failed' ? result.error : new Error(`Workflow status ${result.status}`);
        launchStore.failRun(launchId, error);
        throw error instanceof Error ? error : new Error(String(error));
    }
    return launchStore.requireRun(launchId);
}
export function startLaunch(idea) {
    const launchId = randomUUID();
    launchStore.createRun(idea, launchId);
    void openclawWorkflow
        .createRun()
        .then(run => run.start({
        inputData: {
            launchId,
            idea,
        },
    }))
        .then(result => {
        if (result.status !== 'success') {
            const error = result.status === 'failed' ? result.error : new Error(`Workflow status ${result.status}`);
            launchStore.failRun(launchId, error);
        }
    })
        .catch(error => {
        launchStore.failRun(launchId, error);
    });
    return launchStore.requireRun(launchId);
}
export function getLaunchRun(launchId) {
    return launchStore.getRun(launchId);
}
