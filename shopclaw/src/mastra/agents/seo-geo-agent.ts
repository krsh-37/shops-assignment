import { isDevMode } from '../config/openclaw-config.js';
import { seoGeoTool } from '../tools/seo-geo-tool.js';
import { createOpenClawAgent, defaultModel } from './_shared.js';

export const seoAgent = createOpenClawAgent({
  id: 'seo-agent',
  name: 'SEO GEO Agent',
  description: 'Generates SEO and AI-discoverability outputs from launch memory.',
  instructions:
    'Generate SEO clusters and GEO-ready pages, then return only the final SEO object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  ...(isDevMode() ? {} : { tools: { seoGeoTool } }),
});
