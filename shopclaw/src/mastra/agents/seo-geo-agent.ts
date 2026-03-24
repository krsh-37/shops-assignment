import { createOpenClawAgent, defaultModel } from './_shared.js';
import { seoGeoTool } from '../tools/seo-geo-tool.js';

export const seoAgent = createOpenClawAgent({
  id: 'seo-agent',
  name: 'SEO GEO Agent',
  description: 'Generates SEO and AI-discoverability outputs from launch memory.',
  instructions:
    'You generate search and AI-discoverability outputs, including keyword strategy, FAQs, and content planning from shared Mem0 context.',
  model: defaultModel,
  tools: { seoGeoTool },
});
