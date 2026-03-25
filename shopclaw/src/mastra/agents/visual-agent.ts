import { createOpenClawAgent, defaultModel } from './_shared.js';
import { logoGenerationTool } from '../tools/logo-generation-tool.js';
import { visualDirectionTool } from '../tools/visual-direction-tool.js';

export const visualAgent = createOpenClawAgent({
  id: 'visual-agent',
  name: 'Visual Agent',
  description: 'Creates brand name selection, logo directions, palette, and mood.',
  instructions:
    'Generate three distinct logo directions with the logo generation tool, then return only the final visual object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  tools: { logoGenerationTool, visualDirectionTool },
});
