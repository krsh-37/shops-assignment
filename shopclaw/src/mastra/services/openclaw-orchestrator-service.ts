import { getLaunchRun } from './openclaw-launch-service.js';
import { getLaunchStatusTool } from '../tools/get-launch-status-tool.js';
import { resumeLaunchWorkflowTool } from '../tools/resume-launch-workflow-tool.js';
import { selectVisualConceptTool } from '../tools/select-visual-concept-tool.js';
import { startLaunchWorkflowTool } from '../tools/start-launch-workflow-tool.js';

export async function submitIdeaToOrchestrator(idea: string) {
  return (startLaunchWorkflowTool.execute as any)({ idea }, {});
}

export async function answerClarificationsThroughOrchestrator(launchId: string, answers: string[]) {
  return (resumeLaunchWorkflowTool.execute as any)({ launchId, answers }, {});
}

export async function chooseVisualThroughOrchestrator(launchId: string, conceptIndex: number) {
  return (selectVisualConceptTool.execute as any)({ launchId, conceptIndex }, {});
}

export async function getLaunchStatusThroughOrchestrator(launchId: string) {
  return (getLaunchStatusTool.execute as any)({ launchId }, {});
}

export async function handleOrchestratorMessage(input: {
  message?: string;
  launchId?: string;
  answers?: string[];
  conceptIndex?: number;
}) {
  if (input.launchId && typeof input.conceptIndex === 'number') {
    const control = await chooseVisualThroughOrchestrator(input.launchId, input.conceptIndex);
    return {
      control,
      reply: `Visual concept ${input.conceptIndex + 1} selected. Continuing the launch workflow.`,
    };
  }

  if (input.launchId && input.answers && input.answers.length > 0) {
    const control = await answerClarificationsThroughOrchestrator(input.launchId, input.answers);
    return {
      control,
      reply:
        control.phase === 'visual-selection'
          ? 'Upfront clarifications captured. Review the three visual concepts and choose one to continue.'
          : 'Clarifications captured. The launch workflow is running.',
    };
  }

  if (input.launchId && !input.message) {
    const control = await getLaunchStatusThroughOrchestrator(input.launchId);
    return {
      control,
      reply: `Launch ${input.launchId} is currently ${control.status}${control.phase ? ` (${control.phase})` : ''}.`,
    };
  }

  if (input.message) {
    const control = await submitIdeaToOrchestrator(input.message);
    return {
      control,
      reply: 'OpenClaw captured the idea and prepared the upfront clarification batch.',
    };
  }

  throw new Error('Provide either a founder idea, clarification answers, a visual selection, or a launchId for status.');
}

export function requireLaunchForOrchestrator(launchId: string) {
  const run = getLaunchRun(launchId);
  if (!run) {
    throw new Error(`Launch run ${launchId} was not found.`);
  }
  return run;
}
