import type { LaunchClarificationInput, LaunchRunStore } from '../tools/launch-run.js';
import type { LaunchOrchestratorHooks, LaunchOrchestratorResult } from '../agents/orchestrator.js';
import { orchestrateLaunchRun, resumeLaunchRun } from '../agents/orchestrator.js';

export interface OpenClawWorkflowDefinition {
  id: 'openclaw';
  phase: 'phase-01';
  steps: ['launch-run', 'clarification-gate'];
}

export const openClawWorkflowDefinition: OpenClawWorkflowDefinition = {
  id: 'openclaw',
  phase: 'phase-01',
  steps: ['launch-run', 'clarification-gate'],
};

export function startOpenClawWorkflow(
  prompt: unknown,
  store: LaunchRunStore,
  clarification: LaunchClarificationInput,
  now?: () => Date,
  hooks?: LaunchOrchestratorHooks,
): Promise<LaunchOrchestratorResult> {
  return orchestrateLaunchRun(prompt, store, clarification, now, hooks);
}

export function continueOpenClawWorkflow(
  runId: string,
  store: LaunchRunStore,
  clarificationPatch: LaunchClarificationInput,
  now?: () => Date,
  hooks?: LaunchOrchestratorHooks,
): Promise<LaunchOrchestratorResult> {
  return resumeLaunchRun(runId, store, clarificationPatch, now, hooks);
}
