export type WorkflowStepName = 'research' | 'domain' | 'visual' | 'shopify';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed';

export interface LaunchWorkflowHandlers {
  research: () => Promise<void>;
  domain: () => Promise<void>;
  visual?: () => Promise<void>;
  shopify?: () => Promise<void>;
}

export interface LaunchWorkflowState {
  steps: Record<WorkflowStepName, WorkflowStepStatus>;
  startedSteps: WorkflowStepName[];
  completedSteps: WorkflowStepName[];
  pendingSteps: WorkflowStepName[];
}

export interface LaunchWorkflowOptions {
  gtmComplete?: boolean;
}

function createInitialWorkflowState(): LaunchWorkflowState {
  return {
    steps: {
      research: 'pending',
      domain: 'pending',
      visual: 'pending',
      shopify: 'pending',
    },
    startedSteps: [],
    completedSteps: [],
    pendingSteps: [],
  };
}

async function runStep(state: LaunchWorkflowState, name: WorkflowStepName, handler: () => Promise<void>): Promise<void> {
  state.steps[name] = 'running';
  state.startedSteps.push(name);
  await handler();
  state.steps[name] = 'completed';
  state.completedSteps.push(name);
}

function markPending(state: LaunchWorkflowState, name: WorkflowStepName): void {
  if (!state.pendingSteps.includes(name)) {
    state.pendingSteps.push(name);
  }
  state.steps[name] = 'pending';
}

// Implements FRD-008, FRD-009, FRD-010
export async function runLaunchWorkflow(
  handlers: LaunchWorkflowHandlers,
  options: LaunchWorkflowOptions = {},
): Promise<LaunchWorkflowState> {
  const state = createInitialWorkflowState();
  const researchPromise = runStep(state, 'research', handlers.research);
  const domainPromise = runStep(state, 'domain', handlers.domain);

  await researchPromise;

  if (handlers.visual) {
    await runStep(state, 'visual', handlers.visual);
  } else {
    markPending(state, 'visual');
  }

  if (options.gtmComplete && handlers.shopify) {
    await runStep(state, 'shopify', handlers.shopify);
  } else {
    markPending(state, 'shopify');
  }

  await domainPromise;
  return state;
}
