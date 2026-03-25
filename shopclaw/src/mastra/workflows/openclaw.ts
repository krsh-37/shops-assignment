import { randomUUID } from 'node:crypto';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { isDevMode } from '../config/openclaw-config.js';
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
import {
  adsGenerationInputSchema,
  adsMemorySchema,
  domainMemorySchema,
  gtmGenerationInputSchema,
  gtmMemorySchema,
  ideaMemorySchema,
  launchBibleInputSchema,
  launchBibleSchema,
  launchInputSchema,
  launchTokenSchema,
  researchMemorySchema,
  seoMemorySchema,
  seoGenerationInputSchema,
  shopifyMemorySchema,
  shopifyGenerationInputSchema,
  visualMemorySchema,
  visualGenerationInputSchema,
  workflowLaunchInputSchema,
  type OpenClawMemory,
} from '../domain/openclaw/schemas.js';
import { orchestratorAgent } from '../agents/orchestrator-agent.js';
import { researchAgent } from '../agents/research-agent.js';
import { domainAgent } from '../agents/domain-agent.js';
import { visualAgent } from '../agents/visual-agent.js';
import { gtmAgent } from '../agents/india-gtm-agent.js';
import { shopifyAgent } from '../agents/shopify-agent.js';
import { adsAgent } from '../agents/performance-ads-agent.js';
import { seoAgent } from '../agents/seo-geo-agent.js';
import { launchReportAgent } from '../agents/launch-report-agent.js';
import { mem0 } from '../memory/mem0.js';
import {
  adsStrategyTool,
  gtmPlanTool,
  launchReportTool,
  seoGeoTool,
  shopifyAssetsTool,
  visualDirectionTool,
} from '../tools/index.js';

function readMem0(launchId: string): OpenClawMemory {
  return mem0.read(launchId);
}

function memoryOptions(launchId: string) {
  return {
    memory: {
      thread: launchId,
      resource: `launch-${launchId}`,
    },
  };
}

async function generateStructured<T>(
  agent: any,
  prompt: string,
  schema: z.ZodType<T>,
  launchId: string,
) {
  const response = await agent.generate(prompt, {
    ...memoryOptions(launchId),
    maxSteps: 5,
    structuredOutput: {
      schema,
      jsonPromptInjection: true,
    },
  });

  if (!response.object) {
    throw new Error(`Structured output generation failed for agent ${agent.name}`);
  }

  return response.object as T;
}

const initializeRunStep = createStep({
  id: 'initialize-run',
  description: 'Creates a launch run and internal launchId for workflow execution.',
  retries: 0,
  inputSchema: workflowLaunchInputSchema,
  outputSchema: launchInputSchema,
  execute: async ({ inputData }) => {
    const launchId = randomUUID();
    mem0.ensureRun(inputData.idea, launchId);

    return {
      launchId,
      idea: inputData.idea,
    };
  },
});

const orchestratorStep = createStep({
  id: 'orchestrator',
  description: 'Initializes Mem0 and upfront clarifications.',
  retries: 0,
  inputSchema: launchInputSchema,
  outputSchema: launchInputSchema,
  execute: async ({ inputData }) => {
    const { launchId, idea } = inputData;
    const run = mem0.ensureRun(idea, launchId);
    mem0.updateStatus(launchId, 'orchestrator-agent');
    const mem0Context = await mem0.recall(idea, launchId);
    const clarificationAnswers = run.clarificationAnswers;

    const ideaMemory = isDevMode()
      ? await generateStructured(
          orchestratorAgent,
          `Analyze this founder idea and return structured launch initialization data.

Idea: ${idea}
Clarification answers:
${clarificationAnswers.join('\n') || 'None provided yet'}
Relevant Mem0 context:
${mem0Context.join('\n') || 'None'}

Return:
- category
- 5 brand name candidates
- up to 3 batched clarification questions with practical assumptions
- clarification_answers populated from the provided answers`,
          ideaMemorySchema.omit({ raw: true }),
          launchId,
        ).then(result => ({
          ...(result as Omit<z.infer<typeof ideaMemorySchema>, 'raw'>),
          raw: idea,
          clarification_answers: clarificationAnswers,
        }))
      : {
          raw: idea,
          category: inferCategory(idea),
          brand_name_candidates: generateBrandCandidates(idea),
          clarification_questions: clarificationAnswers.length > 0 ? [] : buildClarifications(idea),
          clarification_answers: clarificationAnswers,
        };

    await mem0.write(launchId, 'idea', ideaMemory, 'orchestrator-agent');
    mem0.markAgentCompleted(launchId, 'orchestrator-agent');
    return inputData;
  },
});

const researchStep = createStep({
  id: 'research',
  description: 'Generates structured market research into Mem0.',
  retries: 0,
  inputSchema: launchInputSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    mem0.updateStatus(inputData.launchId, 'research-agent');
    const memory = readMem0(inputData.launchId);
    const mem0Context = await mem0.recall(`${inputData.idea} competitors market size keywords India`, inputData.launchId);
    const research = isDevMode()
      ? await generateStructured(
          researchAgent,
          `Research this brand launch idea for India.

Idea: ${inputData.idea}
Use the research tool to gather current market and competitor information before answering.
Relevant Mem0 context:
${mem0Context.join('\n') || 'None'}

Return structured output only.`,
          researchMemorySchema,
          inputData.launchId,
        )
      : buildResearch(inputData.idea, memory);

    await mem0.write(inputData.launchId, 'research', research, 'research-agent');
    mem0.markAgentCompleted(inputData.launchId, 'research-agent');
    return { launchId: inputData.launchId };
  },
});

const domainStep = createStep({
  id: 'domain',
  description: 'Generates a ranked domain shortlist into Mem0.',
  retries: 0,
  inputSchema: launchInputSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    mem0.updateStatus(inputData.launchId, 'domain-agent');
    const memory = readMem0(inputData.launchId);
    const mem0Context = await mem0.recall(`${inputData.idea} brand naming domain`, inputData.launchId);
    const domains = isDevMode()
      ? await generateStructured(
          domainAgent,
          `Generate 15 strong brand name and domain candidates for this founder idea, use the domain availability tool to check likely availability for the domains you choose, then return the best ranked 5.

Idea: ${inputData.idea}
Known idea context: ${JSON.stringify(memory.idea)}
Relevant Mem0 context:
${mem0Context.join('\n') || 'None'}

Only return the final structured shortlist with recommended and top5.`,
          domainMemorySchema,
          inputData.launchId,
        )
      : buildDomainOptions(memory);

    await mem0.write(inputData.launchId, 'domains', domains, 'domain-agent');
    mem0.markAgentCompleted(inputData.launchId, 'domain-agent');
    return { launchId: inputData.launchId };
  },
});

const visualStep = createStep({
  id: 'visual',
  description: 'Builds the visual direction from Mem0.',
  retries: 0,
  inputSchema: z.object({
    research: launchTokenSchema,
    domain: launchTokenSchema,
  }),
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    const launchId = inputData.research.launchId;
    mem0.updateStatus(launchId, 'visual-agent');
    const memory = readMem0(launchId);
    const mem0Context = await mem0.recall(`${memory.idea?.raw} visual brand palette logo`, launchId);
    const visual = isDevMode()
      ? await generateStructured(
          visualAgent,
          `Create a visual identity for this brand.

Input:
${JSON.stringify(
  visualGenerationInputSchema.parse({
    idea: memory.idea?.raw,
    research: memory.research,
    domains: memory.domains,
    mem0_context: mem0Context,
  }),
)}

Return 3 logo concepts with prompts and placeholder image URLs that represent likely generated assets.`,
          visualMemorySchema,
          launchId,
        )
      : await (visualDirectionTool.execute as any)({ memory }, {});

    await mem0.write(launchId, 'visual', visual, 'visual-agent');
    mem0.markAgentCompleted(launchId, 'visual-agent');
    return { launchId };
  },
});

const gtmStep = createStep({
  id: 'gtm',
  description: 'Generates the India-first GTM plan from Mem0.',
  retries: 0,
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    mem0.updateStatus(inputData.launchId, 'gtm-agent');
    const memory = readMem0(inputData.launchId);
    const mem0Context = await mem0.recall(`${memory.idea?.raw} go to market india`, inputData.launchId);
    const gtm = isDevMode()
      ? await generateStructured(
          gtmAgent,
          `Create an India-first GTM plan.

Input:
${JSON.stringify(
  gtmGenerationInputSchema.parse({
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    domains: memory.domains,
    mem0_context: mem0Context,
  }),
)}

Return only structured output.`,
          gtmMemorySchema,
          inputData.launchId,
        )
      : await (gtmPlanTool.execute as any)({ memory }, {});

    await mem0.write(inputData.launchId, 'gtm', gtm, 'gtm-agent');
    mem0.markAgentCompleted(inputData.launchId, 'gtm-agent');
    return inputData;
  },
});

const shopifyStep = createStep({
  id: 'shopify',
  description: 'Generates Shopify assets from Mem0.',
  retries: 0,
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    mem0.updateStatus(inputData.launchId, 'shopify-agent');
    const memory = readMem0(inputData.launchId);
    const mem0Context = await mem0.recall(`${memory.idea?.raw} shopify storefront`, inputData.launchId);
    const shopify = isDevMode()
      ? await generateStructured(
          shopifyAgent,
          `Generate a Shopify launch package.

Input:
${JSON.stringify(
  shopifyGenerationInputSchema.parse({
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    gtm: memory.gtm,
    mem0_context: mem0Context,
  }),
)}

Return structured output only. Theme colors must come from the visual palette and product descriptions must reflect research keywords.`,
          shopifyMemorySchema,
          inputData.launchId,
        )
      : await (shopifyAssetsTool.execute as any)({ memory }, {});

    await mem0.write(inputData.launchId, 'shopify', shopify, 'shopify-agent');
    mem0.markAgentCompleted(inputData.launchId, 'shopify-agent');
    return inputData;
  },
});

const adsStep = createStep({
  id: 'ads',
  description: 'Generates paid media strategy from Mem0.',
  retries: 0,
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    mem0.updateStatus(inputData.launchId, 'ads-agent');
    const memory = readMem0(inputData.launchId);
    const mem0Context = await mem0.recall(`${memory.idea?.raw} paid ads india`, inputData.launchId);
    const ads = isDevMode()
      ? await generateStructured(
          adsAgent,
          `Create a paid media launch strategy.

Input:
${JSON.stringify(
  adsGenerationInputSchema.parse({
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    gtm: memory.gtm,
    mem0_context: mem0Context,
  }),
)}

Return only structured output.`,
          adsMemorySchema,
          inputData.launchId,
        )
      : await (adsStrategyTool.execute as any)({ memory }, {});

    await mem0.write(inputData.launchId, 'ads', ads, 'ads-agent');
    mem0.markAgentCompleted(inputData.launchId, 'ads-agent');
    return inputData;
  },
});

const seoStep = createStep({
  id: 'seo',
  description: 'Generates SEO and GEO strategy from Mem0.',
  retries: 0,
  inputSchema: z.object({
    shopify: launchTokenSchema,
    ads: launchTokenSchema,
  }),
  outputSchema: launchTokenSchema,
  execute: async ({ inputData, mastra }) => {
    const launchId = inputData.shopify.launchId;
    mem0.updateStatus(launchId, 'seo-agent');
    const memory = readMem0(launchId);
    const mem0Context = await mem0.recall(`${memory.idea?.raw} SEO GEO India`, launchId);
    const seo = isDevMode()
      ? await generateStructured(
          seoAgent,
          `Create SEO and GEO outputs.

Input:
${JSON.stringify(
  seoGenerationInputSchema.parse({
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    shopify: memory.shopify,
    ads: memory.ads,
    mem0_context: mem0Context,
  }),
)}

Return only structured output.`,
          seoMemorySchema,
          launchId,
        )
      : await (seoGeoTool.execute as any)({ memory }, {});

    await mem0.write(launchId, 'seo', seo, 'seo-agent');
    mem0.markAgentCompleted(launchId, 'seo-agent');
    return { launchId };
  },
});

const reportStep = createStep({
  id: 'report',
  description: 'Synthesizes the final launch bible from Mem0.',
  retries: 0,
  inputSchema: launchTokenSchema,
  outputSchema: launchBibleSchema,
  execute: async ({ inputData, mastra }) => {
    mem0.updateStatus(inputData.launchId, 'launch-report-agent');
    const memory = readMem0(inputData.launchId);
    const mem0Context = await mem0.recall(`${memory.idea?.raw} final launch bible`, inputData.launchId);
    const report = isDevMode()
      ? await generateStructured(
          launchReportAgent,
          `Create the final brand launch bible.

Input:
${JSON.stringify(
  launchBibleInputSchema.parse({
    memory,
    mem0_context: mem0Context,
  }),
)}

Return only structured output.`,
          launchBibleSchema,
          inputData.launchId,
        )
      : await (launchReportTool.execute as any)({ memory }, {});

    await mem0.completeRun(inputData.launchId, report);
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
