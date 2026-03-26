import { z } from 'zod';

export const clarificationSchema = z.object({
  question: z.string(),
  assumption: z.string(),
});

export const clarificationTargetSchema = z.enum([
  'idea',
  'brief',
  'research',
  'visual',
  'domains',
  'gtm',
  'shopify',
  'ads',
  'seo',
]);

export const clarificationPromptSchema = z.object({
  id: z.string(),
  question: z.string(),
  rationale: z.string(),
  target_sections: z.array(clarificationTargetSchema).min(1),
  assumption: z.string().optional(),
});

export const clarificationAnswerSchema = z.object({
  question_id: z.string(),
  question: z.string(),
  answer: z.string(),
  target_sections: z.array(clarificationTargetSchema).min(1),
});

export const competitorSchema = z.object({
  name: z.string(),
  region: z.string(),
  positioning: z.string(),
  notes: z.string(),
});

export const researchMemorySchema = z.object({
  competitors: z.array(competitorSchema),
  market_size_inr: z.string(),
  whitespace: z.string(),
  keywords: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
  }),
  india_insight: z.string(),
});

export const logoConceptSchema = z.object({
  name: z.string(),
  mood: z.string(),
  prompt: z.string(),
  image_url: z.string().url(),
});

export const visualMemorySchema = z.object({
  brand_name: z.string(),
  logo_concepts: z.array(logoConceptSchema).length(3),
  chosen_concept: z.number().int().min(0).max(2),
  palette: z.array(z.string()).min(3),
  font_pairing: z.string(),
  mood: z.string(),
});

export const domainResultSchema = z.object({
  name: z.string(),
  domain: z.string(),
  available: z.boolean(),
  price_inr: z.number().int().nonnegative(),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
});

export const domainMemorySchema = z.object({
  recommended: z.string(),
  top5: z.array(domainResultSchema).length(5),
  candidates15: z.array(domainResultSchema).length(15),
});

export const gtmMemorySchema = z.object({
  launch_cities: z.array(z.string()).min(1),
  channels: z.object({
    instagram: z.string(),
    whatsapp: z.string(),
    google: z.string(),
  }),
  reel_ideas: z.array(z.string()).length(10),
  influencer_brief: z.string(),
  week1_checklist: z.array(z.string()).min(5),
});

const shopifyTemplateScalarSchema = z.union([z.string(), z.number(), z.boolean()]);
const shopifySectionSchema = z.object({
  type: z.string(),
  settings: z.record(z.string(), shopifyTemplateScalarSchema),
  blocks: z.record(
    z.string(),
    z.object({
      type: z.string(),
      settings: z.record(z.string(), shopifyTemplateScalarSchema),
    }),
  ).optional(),
  block_order: z.array(z.string()).optional(),
});

export const shopifyTemplatesSchema = z.object({
  config_settings_data: z.object({
    current: z.object({
      theme_name: z.string(),
      theme_version: z.string(),
      settings: z.record(z.string(), shopifyTemplateScalarSchema),
    }),
    presets: z.record(z.string(), z.unknown()),
  }),
  templates_index: z.object({
    sections: z.record(z.string(), shopifySectionSchema),
    order: z.array(z.string()).min(1),
  }),
  locales_en_default: z.record(z.string(), z.unknown()).refine(value => Object.keys(value).length > 0, {
    message: 'locales_en_default must contain at least one translation key.',
  }),
  readme_markdown: z.string().min(1),
});

export const shopifyMemorySchema = z.object({
  theme_settings: z.object({
    theme: z.string(),
    palette: z.array(z.string()),
    fonts: z.object({
      heading: z.string(),
      body: z.string(),
    }),
    hero_cta: z.string(),
  }),
  products: z.array(
    z.object({
      title: z.string(),
      price_inr: z.number().int().positive(),
      description: z.string(),
      tags: z.array(z.string()),
    }),
  ),
  homepage: z.object({
    hero_headline: z.string(),
    hero_subheadline: z.string(),
    value_props: z.array(z.string()).length(3),
  }),
  collections: z.array(
    z.object({
      name: z.string(),
      handle: z.string(),
      description: z.string(),
    }),
  ),
  templates: shopifyTemplatesSchema,
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
      kind: z.enum(['json', 'liquid', 'markdown']),
    }),
  ).min(4),
  package_summary: z.string(),
});

export const metaAdSchema = z.object({
  format: z.string(),
  hook: z.string(),
  body: z.string(),
  cta: z.string(),
  audience: z.string(),
  budget_day_inr: z.number().int().positive(),
});

export const googleCampaignSchema = z.object({
  name: z.string(),
  budget_day_inr: z.number().int().positive(),
  ad_groups: z.array(
    z.object({
      name: z.string(),
      keywords: z.array(z.string()),
      match_type: z.enum(['broad', 'phrase', 'exact']),
    }),
  ),
});

export const pacingPlanSchema = z.object({
  start_budget_day_inr: z.number().int().positive(),
  scale_trigger: z.string(),
  milestones: z.array(z.string()).min(3),
});

export const adsMemorySchema = z.object({
  meta_ads: z.array(metaAdSchema).length(3),
  google_campaigns: z.array(googleCampaignSchema).length(2),
  pacing_plan: pacingPlanSchema,
});

export const seoMemorySchema = z.object({
  keywords: z.array(z.string()).min(5),
  geo_faqs: z.array(z.string()).length(5),
  content_calendar: z.array(z.string()).min(4),
  geo_pages: z.array(
    z.object({
      title: z.string(),
      slug: z.string(),
      target_query: z.string(),
      body: z.string(),
      citation_notes: z.array(z.string()).min(2),
    }),
  ).length(5),
});

export const briefMemorySchema = z.object({
  answers: z.array(clarificationAnswerSchema).min(1),
  founder_brief: z.string(),
});

export const researchSourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});

export const researchSynthesisInputSchema = z.object({
  idea: z.string(),
  search_results: z.array(researchSourceSchema).min(1),
  mem0_context: z.array(z.string()).default([]),
});

export const domainCandidateSchema = z.object({
  name: z.string(),
  domain: z.string(),
  reasoning: z.string(),
});

export const domainIdeationSchema = z.object({
  candidates: z.array(domainCandidateSchema).min(5).max(15),
});

export const visualGenerationInputSchema = z.object({
  idea: z.string(),
  research: researchMemorySchema,
  domains: domainMemorySchema,
  mem0_context: z.array(z.string()).default([]),
});

export const gtmGenerationInputSchema = z.object({
  idea: z.string(),
  research: researchMemorySchema,
  visual: visualMemorySchema,
  domains: domainMemorySchema,
  mem0_context: z.array(z.string()).default([]),
});

export const shopifyGenerationInputSchema = z.object({
  idea: z.string(),
  research: researchMemorySchema,
  visual: visualMemorySchema,
  gtm: gtmMemorySchema,
  mem0_context: z.array(z.string()).default([]),
});

export const adsGenerationInputSchema = z.object({
  idea: z.string(),
  research: researchMemorySchema,
  visual: visualMemorySchema,
  gtm: gtmMemorySchema,
  mem0_context: z.array(z.string()).default([]),
});

export const seoGenerationInputSchema = z.object({
  idea: z.string(),
  research: researchMemorySchema,
  visual: visualMemorySchema,
  shopify: shopifyMemorySchema,
  ads: adsMemorySchema,
  mem0_context: z.array(z.string()).default([]),
});

export const auditLogSchema = z.object({
  agent: z.string(),
  action: z.string(),
  timestamp: z.string(),
  keys_written: z.array(z.string()),
});

export const ideaMemorySchema = z.object({
  raw: z.string(),
  category: z.string(),
  brand_name_candidates: z.array(z.string()),
  clarification_questions: z.array(clarificationSchema),
  clarification_answers: z.array(z.string()).default([]),
});

export const orchestratorIdeaInputSchema = z.object({
  idea: z.string(),
  mem0_context: z.array(z.string()).default([]),
});

export const tavilySearchInputSchema = z.object({
  query: z.string().min(5),
});

export const tavilySearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  content: z.string(),
  score: z.number().optional(),
});

export const tavilySearchOutputSchema = z.object({
  query: z.string(),
  results: z.array(tavilySearchResultSchema),
});

export const fetchPageInputSchema = z.object({
  url: z.string().url(),
});

export const fetchPageOutputSchema = z.object({
  url: z.string().url(),
  title: z.string(),
  content: z.string(),
});

export const domainAvailabilityInputSchema = z.object({
  domain: z.string().min(3),
});

export const domainAvailabilityOutputSchema = z.object({
  domain: z.string(),
  available: z.boolean(),
  status: z.number(),
});

export const domainIdeationInputSchema = z.object({
  idea: z.string(),
  category: z.string().optional(),
  constraints: z.array(z.string()).default([]),
});

export const memorySectionSchema = z.enum(['idea', 'research', 'visual', 'domains', 'gtm', 'shopify', 'ads', 'seo']);
export const launchMemorySectionSchema = z.enum(['idea', 'brief', 'research', 'visual', 'domains', 'gtm', 'shopify', 'ads', 'seo']);

export const readMem0InputSchema = z.object({
  launchId: z.string(),
  section: launchMemorySectionSchema.optional(),
});

export const readMem0OutputSchema = z.object({
  launchId: z.string(),
  memory: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.any()),
    z.record(z.string(), z.any()),
    z.null(),
  ]).optional(),
  full_memory: z.lazy(() => openClawMemorySchema).optional(),
});

export const writeMem0InputSchema = z.object({
  launchId: z.string(),
  section: launchMemorySectionSchema,
  value: z.record(z.string(), z.any()),
  agent: z.string(),
  action: z.string().optional(),
});

export const writeMem0OutputSchema = z.object({
  launchId: z.string(),
  section: launchMemorySectionSchema,
  updatedAt: z.string(),
});

export const askUserInputSchema = z.object({
  launchId: z.string().optional(),
  questions: z.array(clarificationPromptSchema).min(1).max(5),
  reason: z.string(),
});

export const askUserOutputSchema = z.object({
  launchId: z.string().optional(),
  status: z.enum(['awaiting-user-input']),
  questions: z.array(clarificationPromptSchema).min(1).max(5),
  reason: z.string(),
});

export const delegateToAgentInputSchema = z.object({
  agentId: z.string(),
  launchId: z.string().optional(),
  task: z.string(),
});

export const delegateToAgentOutputSchema = z.object({
  delegated: z.boolean(),
  agentId: z.string(),
  task: z.string(),
  launchId: z.string().optional(),
  status: z.string().optional(),
});

export const startWorkflowInputSchema = z.object({
  idea: z.string().min(10),
});

export const resumeWorkflowInputSchema = z.object({
  launchId: z.string().trim().default(''),
  answers: z.array(z.string()).min(1),
});

export const visualSelectionInputSchema = z.object({
  launchId: z.string().trim().default(''),
  conceptIndex: z.number().int().min(0).max(2),
});

export const launchLookupInputSchema = z.object({
  launchId: z.string().trim().default(''),
});

export const launchPhaseSchema = z.enum([
  'draft',
  'clarification',
  'workflow',
  'visual-selection',
  'completed',
  'failed',
]);

export const workflowControlOutputSchema = z.object({
  launchId: z.string(),
  status: z.string(),
  phase: launchPhaseSchema.optional(),
  current_agent: z.string().nullable().optional(),
  completed_agents: z.array(z.string()).optional(),
  pending_questions: z.array(clarificationPromptSchema).optional(),
  pending_reason: z.string().nullable().optional(),
  answers: z.array(z.string()).optional(),
  selected_visual_concept: z.number().int().min(0).max(2).nullable().optional(),
  visual_concepts: z.array(logoConceptSchema).length(3).optional(),
  error: z.string().nullable().optional(),
  report_summary: z.string().optional(),
  next_action: z.string().optional(),
});

export const logoGenerationInputSchema = z.object({
  prompt: z.string(),
  style: z.enum(['minimal', 'bold', 'playful']),
  aspect_ratio: z.string().default('1:1'),
  brand_context: z.string(),
});

export const logoGenerationOutputSchema = logoConceptSchema.extend({
  provider: z.string(),
});

export const openClawMemorySchema = z.object({
  idea: ideaMemorySchema.nullable(),
  brief: briefMemorySchema.nullable(),
  research: researchMemorySchema.nullable(),
  visual: visualMemorySchema.nullable(),
  domains: domainMemorySchema.nullable(),
  gtm: gtmMemorySchema.nullable(),
  shopify: shopifyMemorySchema.nullable(),
  ads: adsMemorySchema.nullable(),
  seo: seoMemorySchema.nullable(),
  audit_log: z.array(auditLogSchema),
});

export const launchBibleInputSchema = z.object({
  memory: openClawMemorySchema,
  mem0_context: z.array(z.string()).default([]),
});

export const launchBibleSchema = z.object({
  brand: z.object({
    idea: z.string(),
    category: z.string(),
    brand_name: z.string(),
    summary: z.string(),
  }),
  visual: z.object({
    logo_urls: z.array(z.string().url()),
    palette: z.array(z.string()),
    mood: z.string(),
  }),
  domain: z.object({
    recommended: z.string(),
    alternatives: z.array(z.string()),
  }),
  gtm: gtmMemorySchema,
  shopify_files: shopifyMemorySchema,
  ads: adsMemorySchema,
  seo_geo: seoMemorySchema,
  roadmap_90d: z.array(z.string()).min(3),
  artifacts: z.array(
    z.object({
      path: z.string(),
      description: z.string(),
    }),
  ).min(4),
  markdown: z.string(),
});

export const launchBibleGenerationSchema = launchBibleSchema.extend({
  shopify_files: shopifyMemorySchema.extend({
    files: shopifyMemorySchema.shape.files.optional(),
  }),
});

export const launchInputSchema = z.object({
  launchId: z.string(),
  idea: z.string().min(10),
});

export const workflowLaunchInputSchema = z.object({
  idea: z.string().min(10),
  launchId: z.string().optional(),
});

export const launchTokenSchema = z.object({
  launchId: z.string(),
});

export const launchStatusSchema = z.enum(['queued', 'running', 'awaiting-user-input', 'completed', 'failed']);

export const launchRunSchema = z.object({
  id: z.string(),
  idea: z.string(),
  conversationThreadId: z.string().nullable().default(null),
  status: launchStatusSchema,
  phase: launchPhaseSchema.default('draft'),
  currentAgent: z.string().nullable(),
  completedAgents: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  memory: openClawMemorySchema,
  report: launchBibleSchema.nullable(),
  error: z.string().nullable(),
  pendingQuestions: z.array(clarificationPromptSchema).default([]),
  pendingReason: z.string().nullable().default(null),
  clarificationAnswers: z.array(z.string()).default([]),
  questionContext: z.array(clarificationPromptSchema).default([]),
  selectedVisualConcept: z.number().int().min(0).max(2).nullable().default(null),
});

export type Clarification = z.infer<typeof clarificationSchema>;
export type ClarificationPrompt = z.infer<typeof clarificationPromptSchema>;
export type ClarificationAnswer = z.infer<typeof clarificationAnswerSchema>;
export type ResearchMemory = z.infer<typeof researchMemorySchema>;
export type BriefMemory = z.infer<typeof briefMemorySchema>;
export type VisualMemory = z.infer<typeof visualMemorySchema>;
export type DomainMemory = z.infer<typeof domainMemorySchema>;
export type GTMMemory = z.infer<typeof gtmMemorySchema>;
export type ShopifyMemory = z.infer<typeof shopifyMemorySchema>;
export type AdsMemory = z.infer<typeof adsMemorySchema>;
export type SEOMemory = z.infer<typeof seoMemorySchema>;
export type OpenClawMemory = z.infer<typeof openClawMemorySchema>;
export type LaunchBible = z.infer<typeof launchBibleSchema>;
export type LaunchBibleGeneration = z.infer<typeof launchBibleGenerationSchema>;
export type LaunchRun = z.infer<typeof launchRunSchema>;

export function createEmptyMemory(): OpenClawMemory {
  return {
    idea: null,
    brief: null,
    research: null,
    visual: null,
    domains: null,
    gtm: null,
    shopify: null,
    ads: null,
    seo: null,
    audit_log: [],
  };
}
