import { createOpenClawAgent, defaultModel } from './_shared.js';
import { logoGenerationTool } from '../tools/logo-generation-tool.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';
import { visualDirectionTool } from '../tools/visual-direction-tool.js';

export const visualAgent = createOpenClawAgent({
  id: 'visual-agent',
  name: 'Visual Agent',
  description: 'Creates brand name selection, logo directions, palette, and mood.',
  instructions:
    'You own the visual memory section. Read research and domain memory first, generate three distinct logo directions with the logo generation tool, and write only the visual package back into shared memory.',
  model: defaultModel,
  tools: { logoGenerationTool, visualDirectionTool, mem0ReadTool, mem0WriteTool },
});
