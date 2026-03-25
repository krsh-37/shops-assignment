import { createOpenClawAgent, defaultModel } from './_shared.js';
import { shopifyAssetsTool } from '../tools/shopify-assets-tool.js';

export const shopifyAgent = createOpenClawAgent({
  id: 'shopify-agent',
  name: 'Shopify Agent',
  description: 'Generates launch-ready Shopify theme, product, homepage, and collection assets.',
  instructions:
    'Generate package-grade Shopify artifacts and return only the final Shopify object. Do not call any memory-writing tool or workflow-control tool.',
  model: defaultModel,
  tools: { shopifyAssetsTool },
});
