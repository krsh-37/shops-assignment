import { createOpenClawAgent, defaultModel } from './_shared.js';
import { launchReportTool } from '../tools/launch-report-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';

export const launchReportAgent = createOpenClawAgent({
  id: 'launch-report-agent',
  name: 'Launch Report Agent',
  description: 'Synthesizes all launch memory into a final launch bible.',
  instructions:
    'You own the final report synthesis. Read all upstream memory, compile the launch bible and artifact references, and only then write the final report completion state.',
  model: defaultModel,
  tools: { launchReportTool, mem0ReadTool, mem0WriteTool },
});
