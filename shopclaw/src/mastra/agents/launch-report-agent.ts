import { isDevMode } from '../config/openclaw-config.js';
import { launchReportTool } from '../tools/launch-report-tool.js';
import { createOpenClawAgent, defaultModel } from './_shared.js';

export const launchReportAgent = createOpenClawAgent({
  id: 'launch-report-agent',
  name: 'Launch Report Agent',
  description: 'Synthesizes all launch memory into a final launch bible.',
  instructions:
    'Compile the launch bible and artifact references, then return only the final report object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  ...(isDevMode() ? {} : { tools: { launchReportTool } }),
});
