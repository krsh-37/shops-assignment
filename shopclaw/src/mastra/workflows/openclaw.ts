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
  normalizeLaunchBible,
} from '../domain/openclaw/content.js';
import {
  adsMemorySchema,
  clarificationPromptSchema,
  domainMemorySchema,
  gtmMemorySchema,
  ideaMemorySchema,
  launchBibleGenerationSchema,
  launchBibleSchema,
  launchInputSchema,
  launchTokenSchema,
  researchMemorySchema,
  seoMemorySchema,
  shopifyMemorySchema,
  visualMemorySchema,
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
import { logRuntime } from '../utils/runtime-log.js';

function setNestedValue(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = target;

  for (const [index, part] of parts.entries()) {
    if (index === parts.length - 1) {
      cursor[part] = value;
      return;
    }

    const next = cursor[part];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cursor[part] = {};
    }

    cursor = cursor[part] as Record<string, unknown>;
  }
}

async function readMem0Paths(launchId: string, paths: string[]): Promise<OpenClawMemory> {
  const values = await mem0.readPaths(launchId, paths);
  const partial: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(values)) {
    setNestedValue(partial, path, value);
  }

  return partial as OpenClawMemory;
}

async function readStepMemory(launchId: string, paths: string[]): Promise<OpenClawMemory> {
  if (!isDevMode()) {
    return mem0.hydrateSharedMemory(launchId);
  }

  return readMem0Paths(launchId, paths);
}

function memoryOptions(agentId: string, launchId: string) {
  return {
    memory: {
      thread: `${launchId}:${agentId}`,
      resource: `launch-${launchId}`,
    },
  };
}

function logMemoryUsage(launchId: string, agent: string, sections: Record<string, unknown>) {
  logRuntime('agent.memory-input', {
    launchId,
    agent,
    using_memory_sections: Object.keys(sections),
    memory_inputs: sections,
  });
}

function logMemoryPaths(launchId: string, agent: string, paths: string[], memory: OpenClawMemory) {
  logRuntime('agent.memory-input', {
    launchId,
    agent,
    requested_paths: paths,
    using_memory_sections: Object.keys(memory).filter(key => memory[key as keyof OpenClawMemory] !== null),
    memory_inputs: memory,
  });
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
    questions: z.array(clarificationPromptSchema).min(1).max(5),
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
    await mem0.write(launchId, 'brief', run.memory.brief, 'orchestrator-agent', 'write:brief');
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
    const memoryPaths = [
      'idea.raw',
      'idea.category',
      'idea.brand_name_candidates',
      'brief.answers',
      'brief.founder_brief',
    ];
    const memory = await readStepMemory(inputData.launchId, memoryPaths);
    logMemoryPaths(inputData.launchId, 'research-agent', memoryPaths, memory);
    const research = isDevMode()
      ? await resolveResearchMemory(inputData.idea, inputData.launchId, memory)
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
    const memoryPaths = [
      'idea.raw',
      'idea.category',
      'idea.brand_name_candidates',
      'brief.answers',
      'brief.founder_brief',
    ];
    const memory = await readStepMemory(inputData.launchId, memoryPaths);
    logMemoryPaths(inputData.launchId, 'domain-agent', memoryPaths, memory);
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
    const memoryPaths = [
      'idea.raw',
      'idea.brand_name_candidates',
      'brief.answers',
      'brief.founder_brief',
      'research.whitespace',
      'research.india_insight',
      'domains.recommended',
      'domains.top5',
    ];
    const memory = await readStepMemory(launchId, memoryPaths);
    logMemoryPaths(launchId, 'visual-agent', memoryPaths, memory);
    const visual = isDevMode()
      ? await generateStructured(
          visualAgent,
          `Create a visual identity for this brand.

Input:
${JSON.stringify(
  {
    idea: memory.idea?.raw,
    research: memory.research,
    domains: memory.domains,
    mem0_context: [memory.brief?.founder_brief ?? ''].filter(Boolean),
  },
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
    const memoryPaths = [
      'idea.raw',
      'brief.answers',
      'brief.founder_brief',
      'research.keywords',
      'research.whitespace',
      'visual.brand_name',
      'visual.mood',
      'visual.palette',
      'domains.recommended',
      'domains.top5',
    ];
    const memory = await readStepMemory(inputData.launchId, memoryPaths);
    logMemoryPaths(inputData.launchId, 'gtm-agent', memoryPaths, memory);
    const gtm = isDevMode()
      ? await generateStructured(
          gtmAgent,
          `Create an India-first GTM plan.

Input:
${JSON.stringify(
  {
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    domains: memory.domains,
    mem0_context: [memory.brief?.founder_brief ?? ''].filter(Boolean),
  },
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
    const memoryPaths = [
      'idea.raw',
      'research.keywords',
      'visual.brand_name',
      'visual.palette',
      'visual.font_pairing',
      'gtm.launch_cities',
    ];
    const memory = await readStepMemory(inputData.launchId, memoryPaths);
    logMemoryPaths(inputData.launchId, 'shopify-agent', memoryPaths, memory);
    const shopify = isDevMode()
      ? await generateStructured(
          shopifyAgent,
          `Generate a Shopify launch package.

Input:
${JSON.stringify(
  {
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    gtm: memory.gtm,
    mem0_context: [],
  },
)}

Return structured output only.

Requirements:
- Theme colors must come from the visual palette.
- Product descriptions must reflect research keywords and the founder's tone.
- The templates field must contain Dawn-compatible structured content for:
  - config_settings_data -> config/settings_data.json
  - templates_index -> templates/index.json
  - locales_en_default -> locales/en.default.json
  - readme_markdown -> README.md
- Use Dawn-style keys such as color_button, color_background, color_text, type_header_font, type_body_font, heading, text, button_label_1, and button_link_1.
- The files array must contain those rendered Shopify files with the same paths.`,
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
    const memoryPaths = [
      'idea.raw',
      'research.keywords',
      'visual.brand_name',
      'gtm.launch_cities',
    ];
    const memory = await readStepMemory(inputData.launchId, memoryPaths);
    logMemoryPaths(inputData.launchId, 'ads-agent', memoryPaths, memory);
    const ads = isDevMode()
      ? await generateStructured(
          adsAgent,
          `Create a paid media launch strategy.

Input:
${JSON.stringify(
  {
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    gtm: memory.gtm,
    mem0_context: [],
  },
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
    const memoryPaths = [
      'idea.raw',
      'brief.answers',
      'brief.founder_brief',
      'research.keywords',
      'visual.brand_name',
      'shopify.homepage',
      'shopify.products',
      'ads.meta_ads',
      'ads.google_campaigns',
      'gtm.launch_cities',
    ];
    const memory = await readStepMemory(launchId, memoryPaths);
    logMemoryPaths(launchId, 'seo-agent', memoryPaths, memory);
    const seo = isDevMode()
      ? await generateStructured(
          seoAgent,
          `Create SEO and GEO outputs.

Input:
${JSON.stringify(
  {
    idea: memory.idea?.raw,
    research: memory.research,
    visual: memory.visual,
    shopify: memory.shopify,
    ads: memory.ads,
    mem0_context: [memory.brief?.founder_brief ?? ''].filter(Boolean),
  },
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
    const memoryPaths = [
      'idea.raw',
      'idea.category',
      'research.competitors',
      'research.market_size_inr',
      'research.whitespace',
      'research.keywords',
      'research.india_insight',
      'visual.brand_name',
      'visual.logo_concepts',
      'visual.palette',
      'visual.mood',
      'domains.recommended',
      'domains.top5',
      'gtm.launch_cities',
      'gtm.channels',
      'gtm.reel_ideas',
      'gtm.influencer_brief',
      'gtm.week1_checklist',
      'shopify.theme_settings',
      'shopify.products',
      'shopify.homepage',
      'shopify.collections',
      'shopify.templates',
      'shopify.files',
      'shopify.package_summary',
      'ads.meta_ads',
      'ads.google_campaigns',
      'ads.pacing_plan',
      'seo.keywords',
      'seo.geo_faqs',
      'seo.content_calendar',
      'seo.geo_pages',
    ];
    const memory = await readStepMemory(inputData.launchId, memoryPaths);
    logMemoryPaths(inputData.launchId, 'launch-report-agent', memoryPaths, memory);
    const report = isDevMode()
      ? normalizeLaunchBible(
          memory,
          await generateStructured(
          launchReportAgent,
          `Create the final brand launch bible.

Input:
${JSON.stringify(
  {
    memory,
    mem0_context: [],
  },
)}

Return only structured output.

The report must not collapse important downstream details into a short executive summary.
Be explicit and concrete in the final report, especially in the markdown field.

The markdown must include:
- Brand overview with founder brief assumptions
- Domain recommendation with alternates and why the winner fits
- Visual identity with palette, mood, font pairing, and concept options
- GTM with launch cities, channel plan, at least 5 reel/content ideas, influencer brief, and week 1 checklist
- Shopify with theme direction, homepage copy, collections, and product titles with pricing
- Advertising with all Meta ad hooks, Google campaign names/budgets, and pacing milestones
- SEO / GEO with primary keywords, geo FAQs, content calendar, and city page intent
- 90-day roadmap
- Artifact list

Do not omit details that already exist in memory.`,
          launchBibleGenerationSchema,
          inputData.launchId,
        ),
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
