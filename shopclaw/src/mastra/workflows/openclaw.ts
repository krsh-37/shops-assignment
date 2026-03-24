import { randomUUID } from 'node:crypto';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  buildAds,
  buildClarifications,
  buildDomainOptions,
  buildGTM,
  buildLaunchBible,
  buildResearch,
  buildSEO,
  buildShopify,
  buildVisualDirection,
  generateBrandCandidates,
  inferCategory,
} from '../domain/openclaw/content.js';
import { launchBibleSchema, launchInputSchema, launchTokenSchema, workflowLaunchInputSchema, type OpenClawMemory } from '../domain/openclaw/schemas.js';
import { mem0 } from '../memory/mem0.js';

function readMem0(launchId: string): OpenClawMemory {
  return mem0.read(launchId);
}

const initializeRunStep = createStep({
  id: 'initialize-run',
  description: 'Creates a launch run and internal launchId for workflow execution.',
  inputSchema: workflowLaunchInputSchema,
  outputSchema: launchInputSchema,
  execute: async ({ inputData }) => {
    const launchId = randomUUID();
    mem0.createRun(inputData.idea, launchId);

    return {
      launchId,
      idea: inputData.idea,
    };
  },
});

const orchestratorStep = createStep({
  id: 'orchestrator',
  description: 'Initializes Mem0 and upfront clarifications.',
  inputSchema: launchInputSchema,
  outputSchema: launchInputSchema,
  execute: async ({ inputData }) => {
    const { launchId, idea } = inputData;
    mem0.updateStatus(launchId, 'orchestrator-agent');
    mem0.write(
      launchId,
      'idea',
      {
        raw: idea,
        category: inferCategory(idea),
        brand_name_candidates: generateBrandCandidates(idea),
        clarification_questions: buildClarifications(idea),
      },
      'orchestrator-agent',
    );
    mem0.markAgentCompleted(launchId, 'orchestrator-agent');
    return inputData;
  },
});

const researchStep = createStep({
  id: 'research',
  description: 'Generates structured market research into Mem0.',
  inputSchema: launchInputSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    mem0.updateStatus(inputData.launchId, 'research-agent');
    mem0.write(inputData.launchId, 'research', buildResearch(inputData.idea, readMem0(inputData.launchId)), 'research-agent');
    mem0.markAgentCompleted(inputData.launchId, 'research-agent');
    return { launchId: inputData.launchId };
  },
});

const domainStep = createStep({
  id: 'domain',
  description: 'Generates a ranked domain shortlist into Mem0.',
  inputSchema: launchInputSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    mem0.updateStatus(inputData.launchId, 'domain-agent');
    mem0.write(inputData.launchId, 'domains', buildDomainOptions(readMem0(inputData.launchId)), 'domain-agent');
    mem0.markAgentCompleted(inputData.launchId, 'domain-agent');
    return { launchId: inputData.launchId };
  },
});

const visualStep = createStep({
  id: 'visual',
  description: 'Builds the visual direction from Mem0.',
  inputSchema: z.object({
    research: launchTokenSchema,
    domain: launchTokenSchema,
  }),
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    const launchId = inputData.research.launchId;
    mem0.updateStatus(launchId, 'visual-agent');
    mem0.write(launchId, 'visual', buildVisualDirection(readMem0(launchId)), 'visual-agent');
    mem0.markAgentCompleted(launchId, 'visual-agent');
    return { launchId };
  },
});

const gtmStep = createStep({
  id: 'gtm',
  description: 'Generates the India-first GTM plan from Mem0.',
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    mem0.updateStatus(inputData.launchId, 'gtm-agent');
    mem0.write(inputData.launchId, 'gtm', buildGTM(readMem0(inputData.launchId)), 'gtm-agent');
    mem0.markAgentCompleted(inputData.launchId, 'gtm-agent');
    return inputData;
  },
});

const shopifyStep = createStep({
  id: 'shopify',
  description: 'Generates Shopify assets from Mem0.',
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    mem0.updateStatus(inputData.launchId, 'shopify-agent');
    mem0.write(inputData.launchId, 'shopify', buildShopify(readMem0(inputData.launchId)), 'shopify-agent');
    mem0.markAgentCompleted(inputData.launchId, 'shopify-agent');
    return inputData;
  },
});

const adsStep = createStep({
  id: 'ads',
  description: 'Generates paid media strategy from Mem0.',
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    mem0.updateStatus(inputData.launchId, 'ads-agent');
    mem0.write(inputData.launchId, 'ads', buildAds(readMem0(inputData.launchId)), 'ads-agent');
    mem0.markAgentCompleted(inputData.launchId, 'ads-agent');
    return inputData;
  },
});

const seoStep = createStep({
  id: 'seo',
  description: 'Generates SEO and GEO strategy from Mem0.',
  inputSchema: z.object({
    shopify: launchTokenSchema,
    ads: launchTokenSchema,
  }),
  outputSchema: launchTokenSchema,
  execute: async ({ inputData }) => {
    const launchId = inputData.shopify.launchId;
    mem0.updateStatus(launchId, 'seo-agent');
    mem0.write(launchId, 'seo', buildSEO(readMem0(launchId)), 'seo-agent');
    mem0.markAgentCompleted(launchId, 'seo-agent');
    return { launchId };
  },
});

const reportStep = createStep({
  id: 'report',
  description: 'Synthesizes the final launch bible from Mem0.',
  inputSchema: launchTokenSchema,
  outputSchema: launchBibleSchema,
  execute: async ({ inputData }) => {
    mem0.updateStatus(inputData.launchId, 'launch-report-agent');
    const report = buildLaunchBible(readMem0(inputData.launchId));
    mem0.completeRun(inputData.launchId, report);
    return report;
  },
});

export const internalOpenclawWorkflow = createWorkflow({
  id: 'openclaw-workflow-internal',
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

internalOpenclawWorkflow.commit();

export const openclawWorkflow = createWorkflow({
  id: 'openclaw-workflow',
  inputSchema: workflowLaunchInputSchema,
  outputSchema: launchBibleSchema,
})
  .then(initializeRunStep)
  .then(internalOpenclawWorkflow);

openclawWorkflow.commit();
