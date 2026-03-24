import { createOpenClawAgent, defaultModel } from './_shared.js';
import { launchReportTool } from '../tools/launch-report-tool.js';

export const launchReportAgent = createOpenClawAgent({
  id: 'launch-report-agent',
  name: 'Launch Report Agent',
  description: 'Synthesizes all launch memory into a final launch bible.',
  instructions:
    'You synthesize all prior Mem0 state into a single launch bible that is coherent, traceable, and launch ready.',
  model: defaultModel,
  tools: { launchReportTool },
});
