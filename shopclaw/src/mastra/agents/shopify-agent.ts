import { createOpenClawAgent, defaultModel } from './_shared.js';
import { shopifyAssetsTool } from '../tools/shopify-assets-tool.js';

export const shopifyAgent = createOpenClawAgent({
  id: 'shopify-agent',
  name: 'Shopify Agent',
  description: 'Generates launch-ready Shopify theme, product, homepage, and collection assets.',
  instructions:
    'You turn visual, research, and GTM memory into usable Shopify theme, product, homepage, and collection payloads. Use Mem0 instead of re-asking for known information.',
  model: defaultModel,
  tools: { shopifyAssetsTool },
});
