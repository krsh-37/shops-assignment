import { createOpenClawAgent, defaultModel } from './_shared.js';
import { mem0ReadTool } from '../tools/mem0-read-tool.js';
import { mem0WriteTool } from '../tools/mem0-write-tool.js';
import { shopifyAssetsTool } from '../tools/shopify-assets-tool.js';

export const shopifyAgent = createOpenClawAgent({
  id: 'shopify-agent',
  name: 'Shopify Agent',
  description: 'Generates launch-ready Shopify theme, product, homepage, and collection assets.',
  instructions:
    'You own the shopify memory section. Read visual, research, and GTM memory before acting. Generate package-grade Shopify artifacts and write only the Shopify package back into shared memory.',
  model: defaultModel,
  tools: { shopifyAssetsTool, mem0ReadTool, mem0WriteTool },
});
