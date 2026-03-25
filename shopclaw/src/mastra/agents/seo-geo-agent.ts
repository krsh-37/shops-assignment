import { createOpenClawAgent, defaultModel } from './_shared.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';
import { seoGeoTool } from '../tools/seo-geo-tool.js';

export const seoAgent = createOpenClawAgent({
  id: 'seo-agent',
  name: 'SEO GEO Agent',
  description: 'Generates SEO and AI-discoverability outputs from launch memory.',
  instructions:
    'You own the seo memory section. Read research, visual, shopify, and ads memory before acting. Generate SEO clusters and GEO-ready pages, then write only the SEO package back into shared memory.',
  model: defaultModel,
  tools: { seoGeoTool, mem0ReadTool, mem0WriteTool },
});
