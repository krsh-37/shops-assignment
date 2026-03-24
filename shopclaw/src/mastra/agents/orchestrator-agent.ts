import { Agent } from '@mastra/core/agent';
import { createOpenClawAgent, defaultModel } from './_shared.js';
import { researchAgent } from './research-agent.js';
import { domainAgent } from './domain-agent.js';
import { visualAgent } from './visual-agent.js';
import { gtmAgent } from './india-gtm-agent.js';
import { shopifyAgent } from './shopify-agent.js';
import { adsAgent } from './performance-ads-agent.js';
import { seoAgent } from './seo-geo-agent.js';
import { launchReportAgent } from './launch-report-agent.js';
import { openclawWorkflow } from '../workflows/openclaw.js';

export const orchestratorAgent = createOpenClawAgent({
  id: 'openclaw-orchestrator',
  name: 'OpenClaw Orchestrator',
  description: 'Supervises the full brand launch process and delegates to specialized agents or the workflow.',
  instructions: `You coordinate the OpenClaw launch workflow.

When the user gives a founder idea:
1. Ask at most 3 clarification questions in one batch if critical information is missing.
2. Prefer running the openclaw workflow for complete brand-launch execution.
3. If the user asks for a specific sub-task, delegate to the most appropriate specialist agent.
4. Read and rely on Mem0 context instead of repeating known questions.
5. Synthesize status clearly after delegations complete.`,
  model: defaultModel,
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
  workflows: async () =>
    ({
      openclawWorkflow,
    }) as Record<string, typeof openclawWorkflow>,
});
