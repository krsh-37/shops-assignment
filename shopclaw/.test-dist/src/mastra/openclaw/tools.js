import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { buildAds, buildDomainOptions, buildGTM, buildLaunchBible, buildResearch, buildSEO, buildShopify, buildVisualDirection, } from './content.js';
import { adsMemorySchema, domainMemorySchema, gtmMemorySchema, launchBibleSchema, openClawMemorySchema, researchMemorySchema, seoMemorySchema, shopifyMemorySchema, visualMemorySchema, } from './schemas.js';
export const researchTool = createTool({
    id: 'openclaw-research-tool',
    description: 'Generate a structured brand research report for the launch idea.',
    inputSchema: z.object({
        idea: z.string(),
        memory: openClawMemorySchema,
    }),
    outputSchema: researchMemorySchema,
    execute: async ({ idea, memory }) => buildResearch(idea, memory),
});
export const domainRankingTool = createTool({
    id: 'openclaw-domain-ranking-tool',
    description: 'Generate and rank brand domains using deterministic availability stubs.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: domainMemorySchema,
    execute: async ({ memory }) => buildDomainOptions(memory),
});
export const visualDirectionTool = createTool({
    id: 'openclaw-visual-direction-tool',
    description: 'Generate brand name selection, logo prompts, and palette outputs.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: visualMemorySchema,
    execute: async ({ memory }) => buildVisualDirection(memory),
});
export const gtmPlanTool = createTool({
    id: 'openclaw-gtm-plan-tool',
    description: 'Generate an India-first GTM plan from shared memory.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: gtmMemorySchema,
    execute: async ({ memory }) => buildGTM(memory),
});
export const shopifyAssetsTool = createTool({
    id: 'openclaw-shopify-assets-tool',
    description: 'Generate Shopify theme and merchandising payloads from prior memory.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: shopifyMemorySchema,
    execute: async ({ memory }) => buildShopify(memory),
});
export const adsStrategyTool = createTool({
    id: 'openclaw-ads-strategy-tool',
    description: 'Generate paid media strategy, ad hooks, and campaign structures.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: adsMemorySchema,
    execute: async ({ memory }) => buildAds(memory),
});
export const seoGeoTool = createTool({
    id: 'openclaw-seo-geo-tool',
    description: 'Generate SEO and GEO outputs from prior research and brand memory.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: seoMemorySchema,
    execute: async ({ memory }) => buildSEO(memory),
});
export const launchReportTool = createTool({
    id: 'openclaw-launch-report-tool',
    description: 'Compile the final launch bible from the shared OpenClaw memory.',
    inputSchema: z.object({
        memory: openClawMemorySchema,
    }),
    outputSchema: launchBibleSchema,
    execute: async ({ memory }) => buildLaunchBible(memory),
});
