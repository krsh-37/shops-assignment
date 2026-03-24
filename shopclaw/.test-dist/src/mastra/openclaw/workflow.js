import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { buildAds, buildClarifications, buildDomainOptions, buildGTM, buildLaunchBible, buildResearch, buildSEO, buildShopify, buildVisualDirection, generateBrandCandidates, inferCategory, } from './content.js';
import { launchStore } from './launch-store.js';
import { launchBibleSchema, launchInputSchema, launchTokenSchema, } from './schemas.js';
function getMemory(launchId) {
    return launchStore.readMemory(launchId);
}
const orchestratorStep = createStep({
    id: 'orchestrator',
    description: 'Initializes the launch memory and upfront clarifications.',
    inputSchema: launchInputSchema,
    outputSchema: launchInputSchema,
    execute: async ({ inputData }) => {
        const { launchId, idea } = inputData;
        launchStore.updateStatus(launchId, 'orchestrator-agent');
        const clarifications = buildClarifications(idea);
        launchStore.writeSection(launchId, 'idea', {
            raw: idea,
            category: inferCategory(idea),
            brand_name_candidates: generateBrandCandidates(idea),
            clarification_questions: clarifications,
        }, 'orchestrator-agent');
        launchStore.markAgentCompleted(launchId, 'orchestrator-agent');
        return inputData;
    },
});
const researchStep = createStep({
    id: 'research',
    description: 'Generates structured market research.',
    inputSchema: launchInputSchema,
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        launchStore.updateStatus(inputData.launchId, 'research-agent');
        const research = buildResearch(inputData.idea, getMemory(inputData.launchId));
        launchStore.writeSection(inputData.launchId, 'research', research, 'research-agent');
        launchStore.markAgentCompleted(inputData.launchId, 'research-agent');
        return { launchId: inputData.launchId };
    },
});
const domainStep = createStep({
    id: 'domain',
    description: 'Generates a ranked domain shortlist.',
    inputSchema: launchInputSchema,
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        launchStore.updateStatus(inputData.launchId, 'domain-agent');
        const domains = buildDomainOptions(getMemory(inputData.launchId));
        launchStore.writeSection(inputData.launchId, 'domains', domains, 'domain-agent');
        launchStore.markAgentCompleted(inputData.launchId, 'domain-agent');
        return { launchId: inputData.launchId };
    },
});
const visualStep = createStep({
    id: 'visual',
    description: 'Builds the visual direction after the first memory writes.',
    inputSchema: z.object({
        research: launchTokenSchema,
        domain: launchTokenSchema,
    }),
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        const launchId = inputData.research.launchId;
        launchStore.updateStatus(launchId, 'visual-agent');
        const visual = buildVisualDirection(getMemory(launchId));
        launchStore.writeSection(launchId, 'visual', visual, 'visual-agent');
        launchStore.markAgentCompleted(launchId, 'visual-agent');
        return { launchId };
    },
});
const gtmStep = createStep({
    id: 'gtm',
    description: 'Generates the India-first GTM plan.',
    inputSchema: launchTokenSchema,
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        launchStore.updateStatus(inputData.launchId, 'gtm-agent');
        const gtm = buildGTM(getMemory(inputData.launchId));
        launchStore.writeSection(inputData.launchId, 'gtm', gtm, 'gtm-agent');
        launchStore.markAgentCompleted(inputData.launchId, 'gtm-agent');
        return inputData;
    },
});
const shopifyStep = createStep({
    id: 'shopify',
    description: 'Generates Shopify assets from shared memory.',
    inputSchema: launchTokenSchema,
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        launchStore.updateStatus(inputData.launchId, 'shopify-agent');
        const shopify = buildShopify(getMemory(inputData.launchId));
        launchStore.writeSection(inputData.launchId, 'shopify', shopify, 'shopify-agent');
        launchStore.markAgentCompleted(inputData.launchId, 'shopify-agent');
        return inputData;
    },
});
const adsStep = createStep({
    id: 'ads',
    description: 'Generates paid media strategy from shared memory.',
    inputSchema: launchTokenSchema,
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        launchStore.updateStatus(inputData.launchId, 'ads-agent');
        const ads = buildAds(getMemory(inputData.launchId));
        launchStore.writeSection(inputData.launchId, 'ads', ads, 'ads-agent');
        launchStore.markAgentCompleted(inputData.launchId, 'ads-agent');
        return inputData;
    },
});
const seoStep = createStep({
    id: 'seo',
    description: 'Generates SEO and GEO strategy from prior memory.',
    inputSchema: z.object({
        shopify: launchTokenSchema,
        ads: launchTokenSchema,
    }),
    outputSchema: launchTokenSchema,
    execute: async ({ inputData }) => {
        const launchId = inputData.shopify.launchId;
        launchStore.updateStatus(launchId, 'seo-agent');
        const seo = buildSEO(getMemory(launchId));
        launchStore.writeSection(launchId, 'seo', seo, 'seo-agent');
        launchStore.markAgentCompleted(launchId, 'seo-agent');
        return { launchId };
    },
});
const reportStep = createStep({
    id: 'report',
    description: 'Synthesizes the final launch bible.',
    inputSchema: launchTokenSchema,
    outputSchema: launchBibleSchema,
    execute: async ({ inputData }) => {
        launchStore.updateStatus(inputData.launchId, 'launch-report-agent');
        const report = buildLaunchBible(getMemory(inputData.launchId));
        launchStore.completeRun(inputData.launchId, report);
        return report;
    },
});
export const openclawWorkflow = createWorkflow({
    id: 'openclaw-workflow',
    inputSchema: launchInputSchema,
    outputSchema: launchBibleSchema,
})
    .then(orchestratorStep)
    .parallel([researchStep, domainStep])
    .then(visualStep)
    .then(gtmStep)
    .parallel([shopifyStep, adsStep])
    .then(seoStep)
    .then(reportStep);
openclawWorkflow.commit();
