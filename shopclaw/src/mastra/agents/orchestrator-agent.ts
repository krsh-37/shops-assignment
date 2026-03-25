import { Agent } from '@mastra/core/agent';
import { isDevMode } from '../config/openclaw-config.js';
import { askUserTool } from '../tools/ask-user-tool.js';
import { delegateToAgentTool } from '../tools/delegate-to-agent-tool.js';
import { getLaunchStatusTool } from '../tools/get-launch-status-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';
import { resumeLaunchWorkflowTool } from '../tools/resume-launch-workflow-tool.js';
import { startLaunchWorkflowTool } from '../tools/start-launch-workflow-tool.js';
import { createOpenClawAgent, defaultModel } from './_shared.js';
import { researchAgent } from './research-agent.js';
import { domainAgent } from './domain-agent.js';
import { visualAgent } from './visual-agent.js';
import { gtmAgent } from './india-gtm-agent.js';
import { shopifyAgent } from './shopify-agent.js';
import { adsAgent } from './performance-ads-agent.js';
import { seoAgent } from './seo-geo-agent.js';
import { launchReportAgent } from './launch-report-agent.js';

export const orchestratorAgent = createOpenClawAgent({
  id: 'openclaw-orchestrator',
  name: 'OpenClaw Orchestrator',
  description: 'Supervises the full brand launch process and delegates to specialized agents only when explicitly requested.',
  instructions: `You coordinate OpenClaw discovery and delegation.

When the user gives a founder idea:
1. Create one upfront bulk clarification batch before starting the workflow.
2. Ask at most 3 high-signal clarification questions in one batch.
3. Do not start the workflow until those answers are captured.
4. Read shared memory before delegating or starting a workflow.
5. If the user asks for a specific sub-task, delegate to the most appropriate specialist agent.
6. If there is already a launch in awaiting-user-input state and the user answers the pending questions, call resumeLaunchWorkflowTool immediately instead of replying with a promise to proceed.
7. Report status clearly after each specialist completes.`,
  model: defaultModel,
  tools: {
    askUserTool,
    delegateToAgentTool,
    getLaunchStatusTool,
    mem0ReadTool,
    mem0WriteTool,
    resumeLaunchWorkflowTool,
    startLaunchWorkflowTool,
  },
  agents: async () =>
    ({
      researchAgent,
      domainAgent,
      visualAgent,
      gtmAgent,
      shopifyAgent,
      adsAgent,
      seoAgent,
      launchReportAgent,
    }) as Record<string, Agent>,
  workflows: isDevMode()
    ? async () =>
        ({
          openclawWorkflow: (await import('../workflows/openclaw.js')).openclawWorkflow as any,
        })
    : undefined,
});
