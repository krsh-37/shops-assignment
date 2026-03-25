import { randomUUID } from 'node:crypto';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { isDevMode } from '../config/openclaw-config.js';
import {
  buildAds,
  buildDomainOptions,
  buildGTM,
  buildLaunchBible,
  buildResearch,
  buildSEO,
  buildShopify,
  buildVisualDirection,
  generateBrandCandidates,
  inferCategory,
  normalizeDomainMemory,
  normalizeGTM,
} from '../domain/openclaw/content.js';
import {
  adsGenerationInputSchema,
  adsMemorySchema,
  clarificationPromptSchema,
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
import { buildFounderBrief, collectLaunchClarifications, normalizeClarificationAnswers } from '../domain/openclaw/content.js';
import { researchAgent } from '../agents/research-agent.js';
import { visualAgent } from '../agents/visual-agent.js';
import { gtmAgent } from '../agents/india-gtm-agent.js';
import { shopifyAgent } from '../agents/shopify-agent.js';
import { adsAgent } from '../agents/performance-ads-agent.js';
import { seoAgent } from '../agents/seo-geo-agent.js';
import { launchReportAgent } from '../agents/launch-report-agent.js';
import { mem0 } from '../memory/mem0.js';
import { getDomainProvider } from '../providers/domain-provider.js';
import { adsStrategyTool } from '../tools/ads-strategy-tool.js';
import { fetchPageTool } from '../tools/fetch-page-tool.js';
import { gtmPlanTool } from '../tools/gtm-plan-tool.js';
import { launchReportTool } from '../tools/launch-report-tool.js';
import { researchTool } from '../tools/research-tool.js';
import { seoGeoTool } from '../tools/seo-geo-tool.js';
import { shopifyAssetsTool } from '../tools/shopify-assets-tool.js';
import { visualDirectionTool } from '../tools/visual-direction-tool.js';

function readMem0(launchId: string): OpenClawMemory {
  return mem0.read(launchId);
}

function memoryOptions(agentId: string, launchId: string) {
  return {
    memory: {
      thread: `${launchId}:${agentId}`,
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
    ...memoryOptions(agent.id ?? agent.name ?? 'agent', launchId),
    maxSteps: 5,
    structuredOutput: {
      schema,
      jsonPromptInjection: true,
    },
  });

  if (!response.object) {
    if (response.text) {
      throw new Error(`Structured output generation failed for agent ${agent.name}: ${response.text}`);
    }
    throw new Error(`Structured output generation failed for agent ${agent.name}`);
  }

  return response.object as T;
}

async function resolveDomainOptions(memory: OpenClawMemory): Promise<z.infer<typeof domainMemorySchema>> {
  const provider = getDomainProvider();
  const seeded = buildDomainOptions(memory);

  const candidates15 = await Promise.all(
    seeded.candidates15.map(async candidate => {
      const lookup = await provider.check(candidate.domain);
      const available = lookup.available;
      return {
        ...candidate,
        available,
        price_inr: available ? candidate.price_inr : 0,
        reasoning: available
          ? candidate.reasoning
          : `${candidate.reasoning} Live RDAP check suggests the domain is already registered.`,
      };
    }),
  );

  const ranked = [...candidates15].sort((left, right) => {
    if (left.available !== right.available) {
      return Number(right.available) - Number(left.available);
    }
    return right.score - left.score;
  });

  return normalizeDomainMemory({
    recommended: ranked.find(candidate => candidate.available)?.domain ?? ranked[0]?.domain ?? seeded.recommended,
    top5: ranked.slice(0, 5),
    candidates15,
  });
}

async function resolveResearchMemory(
  idea: string,
  launchId: string,
  memory: OpenClawMemory,
  mem0Context: string[],
): Promise<z.infer<typeof researchMemorySchema>> {
  const searchQuery = `${idea} India competitors market size keywords`;
  const search = await (researchTool.execute as any)({ query: searchQuery }, {});

  if (!search.results?.length) {
    return buildResearch(idea, memory);
  }

  const fetchedPages = await Promise.all(
    search.results.slice(0, 3).map(async (result: { url: string; title: string; content: string }) => {
      try {
        return await (fetchPageTool.execute as any)({ url: result.url }, {});
      } catch {
        return {
          url: result.url,
          title: result.title,
          content: result.content,
        };
      }
    }),
  );

  return generateStructured(
    researchAgent,
    `Synthesize India market research for this launch idea using the evidence pack below.

Idea: ${idea}
Relevant Mem0 context:
${mem0Context.join('\n') || 'None'}

Search results:
${JSON.stringify(search.results)}

Fetched source excerpts:
${JSON.stringify(fetchedPages)}

Return structured output only.`,
    researchMemorySchema,
    launchId,
  );
}

const visualStructuredOutputSchema = z.union([
  visualMemorySchema.extend({
    chosen_concept: z.number().int().min(0).max(2).default(0),
  }),
  z.object({
    visual_package: visualMemorySchema.extend({
      chosen_concept: z.number().int().min(0).max(2).default(0),
    }),
  }),
]);

const initializeRunStep = createStep({
  id: 'initialize-run',
  description: 'Creates a launch run and internal launchId for workflow execution.',
  retries: 0,
  inputSchema: workflowLaunchInputSchema,
  outputSchema: launchInputSchema,
  execute: async ({ inputData }) => {
    const launchId = inputData.launchId ?? randomUUID();
    mem0.ensureRun(inputData.idea, launchId);

    return {
      launchId,
      idea: inputData.idea,
    };
  },
});

const clarificationGateStep = createStep({
  id: 'clarification-gate',
  description: 'Suspends the workflow until the founder provides the upfront clarification batch.',
  retries: 0,
  inputSchema: launchInputSchema,
  outputSchema: launchInputSchema,
  suspendSchema: z.object({
    questions: z.array(clarificationPromptSchema).min(1).max(3),
    reason: z.string(),
  }),
  resumeSchema: z.object({
    answers: z.array(z.string()).min(1),
  }),
  execute: async ({ inputData, suspend, resumeData }) => {
    const { launchId, idea } = inputData;
    const prompts = collectLaunchClarifications(idea);
    const reason = 'Collect the founder clarifications before starting the OpenClaw workflow.';

    if (!resumeData) {
      mem0.requestHumanInput(launchId, prompts, reason);
      return await suspend({
        questions: prompts,
        reason,
      });
    }

    if (resumeData.answers.length !== prompts.length) {
      throw new Error(`Launch ${launchId} expects ${prompts.length} answers but received ${resumeData.answers.length}.`);
    }

    const normalizedAnswers = normalizeClarificationAnswers(prompts, resumeData.answers);
    const brief = buildFounderBrief(normalizedAnswers);

    mem0.recordHumanAnswers(launchId, resumeData.answers, normalizedAnswers);
    await mem0.writeSection(launchId, 'brief', brief, 'orchestrator-agent', 'write:brief');

    return inputData;
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
    if (!run.memory.brief) {
      throw new Error(`Launch ${launchId} cannot start before upfront clarification answers are captured.`);
    }
    mem0.updateStatus(launchId, 'orchestrator-agent');
    const clarificationAnswers = run.clarificationAnswers;
    const ideaMemory = {
      raw: idea,
      category: inferCategory(idea),
      brand_name_candidates: generateBrandCandidates(idea),
      clarification_questions: [],
      clarification_answers: clarificationAnswers,
    } satisfies z.infer<typeof ideaMemorySchema>;

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
      ? await resolveResearchMemory(inputData.idea, inputData.launchId, memory, mem0Context)
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
    const domains = isDevMode()
      ? await resolveDomainOptions(memory)
      : buildDomainOptions(memory);

    await mem0.write(inputData.launchId, 'domains', normalizeDomainMemory(domains), 'domain-agent');
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
    mem0_context: [...mem0Context, memory.brief?.founder_brief ?? ''],
  }),
)}

Use the founder brief to shape mood, palette, and references.
Return the object at the top level with exactly these keys:
- brand_name
- logo_concepts
- chosen_concept
- palette
- font_pairing
- mood
Do not wrap the result inside visual_package or any other object.`,
          visualStructuredOutputSchema,
          launchId,
        )
      : await (visualDirectionTool.execute as any)({ memory }, {});

    const normalizedVisual = isDevMode()
      ? visualMemorySchema.parse('visual_package' in (visual as any) ? (visual as any).visual_package : visual)
      : visual;

    if (mem0.requireRun(launchId).selectedVisualConcept !== null) {
      normalizedVisual.chosen_concept = mem0.requireRun(launchId).selectedVisualConcept!;
    }

    await mem0.write(launchId, 'visual', normalizedVisual, 'visual-agent');
    mem0.markAgentCompleted(launchId, 'visual-agent');
    return { launchId };
  },
});

const visualSelectionGateStep = createStep({
  id: 'visual-selection-gate',
  description: 'Pauses after the visual package is generated so the founder can choose a concept.',
  retries: 0,
  inputSchema: launchTokenSchema,
  outputSchema: launchTokenSchema,
  suspendSchema: z.object({
    reason: z.string(),
  }),
  resumeSchema: z.object({
    conceptIndex: z.number().int().min(0).max(2),
  }),
  execute: async ({ inputData, suspend, resumeData }) => {
    const run = mem0.requireRun(inputData.launchId);

    if (!run.memory.visual) {
      throw new Error(`Launch ${inputData.launchId} does not have visual concepts available yet.`);
    }

    if (!resumeData) {
      mem0.requestVisualSelection(inputData.launchId);
      return await suspend({
        reason: 'Select one of the three visual concepts before continuing the launch.',
      });
    }

    mem0.setSelectedVisualConcept(inputData.launchId, resumeData.conceptIndex);
    return inputData;
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
    mem0_context: [...mem0Context, memory.brief?.founder_brief ?? ''],
  }),
)}

Rules:
- launch_cities must exactly match the founder-selected launch cities from the brief
- do not introduce additional launch cities that the founder did not name
- keep the GTM city plan tightly aligned to the founder input

Return only structured output.`,
          gtmMemorySchema,
          inputData.launchId,
        )
      : await (gtmPlanTool.execute as any)({ memory }, {});

    await mem0.write(inputData.launchId, 'gtm', normalizeGTM(memory, gtm), 'gtm-agent');
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
    mem0_context: [...mem0Context, memory.brief?.founder_brief ?? ''],
  }),
)}

Differentiate classic SEO from GEO, and use the founder brief plus upstream memory to make city-aware, citation-ready pages. Return only structured output.`,
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

export const preVisualOpenclawWorkflow = createWorkflow({
  id: 'openclaw-workflow-pre-visual',
  inputSchema: launchInputSchema,
  outputSchema: launchTokenSchema,
})
  .then(orchestratorStep)
  .parallel([researchStep, domainStep])
  .then(visualStep);

preVisualOpenclawWorkflow.commit();

export const postVisualOpenclawWorkflow = createWorkflow({
  id: 'openclaw-workflow-post-visual',
  inputSchema: launchTokenSchema,
  outputSchema: launchBibleSchema,
})
  .then(gtmStep)
  .parallel([shopifyStep, adsStep])
  .then(seoStep)
  .then(reportStep);

postVisualOpenclawWorkflow.commit();

export const internalOpenclawWorkflow = preVisualOpenclawWorkflow;

export const openclawWorkflow = createWorkflow({
  id: 'openclaw-workflow',
  inputSchema: workflowLaunchInputSchema,
  outputSchema: launchBibleSchema,
})
  .then(initializeRunStep)
  .then(clarificationGateStep)
  .then(preVisualOpenclawWorkflow)
  .then(visualSelectionGateStep)
  .then(postVisualOpenclawWorkflow);

openclawWorkflow.commit();
