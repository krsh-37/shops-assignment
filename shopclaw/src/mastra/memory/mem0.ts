import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  createEmptyMemory,
  launchRunSchema,
  type ClarificationAnswer,
  type ClarificationPrompt,
  type LaunchBible,
  type LaunchRun,
  type OpenClawMemory,
} from '../domain/openclaw/schemas.js';
import { getMem0Client } from '../providers/mem0-client.js';

type WritableSection = Exclude<keyof OpenClawMemory, 'audit_log'>;
type OpenClawGlobals = typeof globalThis & {
  __openclawMem0?: OpenClawMem0;
};

function nowIso(): string {
  return new Date().toISOString();
}

function padStrings(values: string[] | undefined, min: number, prefix: string): string[] {
  const result = [...(values ?? [])];
  while (result.length < min) {
    result.push(`${prefix} ${result.length + 1}`);
  }
  return result;
}

function getStorePath(): string {
  return resolve(process.cwd(), '.openclaw', 'runs.json');
}

function normalizePersistedRun(raw: any): LaunchRun {
  raw.pendingQuestions ??= [];
  raw.pendingReason ??= null;
  raw.clarificationAnswers ??= [];
  raw.phase ??= 'draft';
  raw.questionContext ??= raw.pendingQuestions;
  raw.selectedVisualConcept ??= null;
  raw.memory ??= createEmptyMemory();
  raw.memory.brief ??= null;

  if (raw?.memory?.idea) {
    raw.memory.idea.clarification_answers ??= raw.clarificationAnswers;
  }

  if (raw?.memory?.shopify) {
    raw.memory.shopify.files ??= [
      { path: '/shopify/theme-settings.json', content: '{}', kind: 'json' },
      { path: '/shopify/products.json', content: '[]', kind: 'json' },
      { path: '/shopify/homepage-sections.json', content: '{}', kind: 'json' },
      { path: '/shopify/collections.json', content: '[]', kind: 'json' },
    ];
    raw.memory.shopify.package_summary ??= 'Migrated legacy Shopify package.';
  }

  if (raw?.memory?.seo) {
    raw.memory.seo.keywords = padStrings(raw.memory.seo.keywords, 5, 'legacy keyword');
    raw.memory.seo.geo_faqs = padStrings(raw.memory.seo.geo_faqs, 5, 'Legacy GEO FAQ');
    raw.memory.seo.content_calendar = padStrings(raw.memory.seo.content_calendar, 4, 'Legacy SEO plan');
    raw.memory.seo.content_calendar ??= [
      'Legacy week 1 SEO plan',
      'Legacy week 2 SEO plan',
      'Legacy week 3 SEO plan',
      'Legacy week 4 SEO plan',
    ];
    raw.memory.seo.geo_pages ??= Array.from({ length: 5 }, (_, index) => ({
      title: `Legacy GEO Page ${index + 1}`,
      slug: `legacy-geo-page-${index + 1}`,
      target_query: `legacy query ${index + 1}`,
      body: 'Migrated legacy GEO page content.',
      citation_notes: ['Legacy migrated content', 'Needs regeneration'],
    }));
  }

  if (raw?.report?.shopify_files) {
    raw.report.shopify_files.files ??= [
      { path: '/shopify/theme-settings.json', content: '{}', kind: 'json' },
      { path: '/shopify/products.json', content: '[]', kind: 'json' },
      { path: '/shopify/homepage-sections.json', content: '{}', kind: 'json' },
      { path: '/shopify/collections.json', content: '[]', kind: 'json' },
    ];
    raw.report.shopify_files.package_summary ??= 'Migrated legacy Shopify package.';
  }

  if (raw?.report?.seo_geo) {
    raw.report.seo_geo.keywords = padStrings(raw.report.seo_geo.keywords, 5, 'legacy keyword');
    raw.report.seo_geo.geo_faqs = padStrings(raw.report.seo_geo.geo_faqs, 5, 'Legacy GEO FAQ');
    raw.report.seo_geo.content_calendar = padStrings(raw.report.seo_geo.content_calendar, 4, 'Legacy SEO plan');
    raw.report.seo_geo.content_calendar ??= [
      'Legacy week 1 SEO plan',
      'Legacy week 2 SEO plan',
      'Legacy week 3 SEO plan',
      'Legacy week 4 SEO plan',
    ];
    raw.report.seo_geo.geo_pages ??= Array.from({ length: 5 }, (_, index) => ({
      title: `Legacy GEO Page ${index + 1}`,
      slug: `legacy-geo-page-${index + 1}`,
      target_query: `legacy query ${index + 1}`,
      body: 'Migrated legacy GEO page content.',
      citation_notes: ['Legacy migrated content', 'Needs regeneration'],
    }));
  }

  if (raw?.report) {
    raw.report.brand ??= {
      idea: raw.idea ?? 'Legacy idea',
      category: raw.memory?.idea?.category ?? 'legacy category',
      brand_name: raw.memory?.visual?.brand_name ?? raw.memory?.idea?.brand_name_candidates?.[0] ?? 'Legacy Brand',
      summary: 'Migrated legacy launch report.',
    };
    raw.report.visual ??= {
      logo_urls: raw.memory?.visual?.logo_concepts?.map((concept: any) => concept.image_url) ?? [],
      palette: raw.memory?.visual?.palette ?? ['#000000', '#ffffff', '#cccccc'],
      mood: raw.memory?.visual?.mood ?? 'legacy',
    };
    raw.report.domain ??= {
      recommended: raw.memory?.domains?.recommended ?? 'legacy.in',
      alternatives: raw.memory?.domains?.top5?.slice(1).map((option: any) => option.domain) ?? [],
    };
    raw.report.gtm ??= raw.memory?.gtm ?? {
      launch_cities: ['Legacy City'],
      channels: { instagram: '40%', whatsapp: '30%', google: '30%' },
      reel_ideas: Array.from({ length: 10 }, (_, index) => `Legacy reel idea ${index + 1}`),
      influencer_brief: 'Legacy influencer brief.',
      week1_checklist: ['Legacy checklist item 1', 'Legacy checklist item 2', 'Legacy checklist item 3', 'Legacy checklist item 4', 'Legacy checklist item 5'],
    };
    raw.report.shopify_files ??= raw.memory?.shopify ?? {
      theme_settings: {
        theme: 'Legacy',
        palette: ['#000000', '#ffffff', '#cccccc'],
        fonts: { heading: 'Legacy Sans', body: 'Legacy Sans' },
        hero_cta: 'Legacy CTA',
      },
      products: [],
      homepage: {
        hero_headline: 'Legacy hero',
        hero_subheadline: 'Legacy subheadline',
        value_props: ['Legacy prop 1', 'Legacy prop 2', 'Legacy prop 3'],
      },
      collections: [],
      files: [
        { path: '/shopify/theme-settings.json', content: '{}', kind: 'json' },
        { path: '/shopify/products.json', content: '[]', kind: 'json' },
        { path: '/shopify/homepage-sections.json', content: '{}', kind: 'json' },
        { path: '/shopify/collections.json', content: '[]', kind: 'json' },
      ],
      package_summary: 'Migrated legacy Shopify package.',
    };
    raw.report.ads ??= raw.memory?.ads ?? {
      meta_ads: Array.from({ length: 3 }, (_, index) => ({
        format: `Legacy format ${index + 1}`,
        hook: `Legacy hook ${index + 1}`,
        body: `Legacy body ${index + 1}`,
        cta: 'Legacy CTA',
        audience: 'Legacy audience',
        budget_day_inr: 500,
      })),
      google_campaigns: Array.from({ length: 2 }, (_, index) => ({
        name: `Legacy campaign ${index + 1}`,
        budget_day_inr: 500,
        ad_groups: [
          {
            name: `Legacy ad group ${index + 1}`,
            keywords: ['legacy keyword'],
            match_type: 'phrase',
          },
        ],
      })),
      pacing_plan: {
        start_budget_day_inr: 500,
        scale_trigger: 'Legacy trigger',
        milestones: ['Legacy milestone 1', 'Legacy milestone 2', 'Legacy milestone 3'],
      },
    };
    raw.report.seo_geo ??= raw.memory?.seo ?? {
      keywords: ['legacy keyword 1', 'legacy keyword 2', 'legacy keyword 3', 'legacy keyword 4', 'legacy keyword 5'],
      geo_faqs: Array.from({ length: 5 }, (_, index) => `Legacy GEO FAQ ${index + 1}`),
      content_calendar: [
        'Legacy week 1 SEO plan',
        'Legacy week 2 SEO plan',
        'Legacy week 3 SEO plan',
        'Legacy week 4 SEO plan',
      ],
      geo_pages: Array.from({ length: 5 }, (_, index) => ({
        title: `Legacy GEO Page ${index + 1}`,
        slug: `legacy-geo-page-${index + 1}`,
        target_query: `legacy query ${index + 1}`,
        body: 'Migrated legacy GEO page content.',
        citation_notes: ['Legacy migrated content', 'Needs regeneration'],
      })),
    };
    raw.report.roadmap_90d ??= ['Legacy milestone 1', 'Legacy milestone 2', 'Legacy milestone 3'];
    raw.report.markdown ??= '# Migrated legacy launch report';
    raw.report.artifacts ??= [
      { path: '/shopify/theme-settings.json', description: 'Migrated theme file.' },
      { path: '/shopify/products.json', description: 'Migrated products file.' },
      { path: '/shopify/homepage-sections.json', description: 'Migrated homepage file.' },
      { path: '/seo/geo-pages.json', description: 'Migrated GEO file.' },
    ];
  }

  return launchRunSchema.parse(raw);
}

function loadRunsFromDisk(path: string): Map<string, LaunchRun> {
  if (!existsSync(path)) {
    return new Map<string, LaunchRun>();
  }

  const raw = readFileSync(path, 'utf8').trim();
  if (!raw) {
    return new Map<string, LaunchRun>();
  }

  const parsed = JSON.parse(raw) as unknown;
  const runs = (Array.isArray(parsed) ? parsed : []).map(normalizePersistedRun);
  return new Map(runs.map(run => [run.id, run]));
}

export class OpenClawMem0 {
  private readonly client = getMem0Client();
  private readonly storePath = getStorePath();
  private readonly runs: Map<string, LaunchRun>;

  constructor() {
    this.runs = loadRunsFromDisk(this.storePath);
  }

  private persist(): void {
    mkdirSync(dirname(this.storePath), { recursive: true });
    const tempPath = `${this.storePath}.${randomUUID()}.tmp`;
    const serialized = JSON.stringify([...this.runs.values()], null, 2);
    writeFileSync(tempPath, serialized, 'utf8');
    renameSync(tempPath, this.storePath);
  }

  createRun(idea: string, launchId: string = randomUUID()): LaunchRun {
    const existingRun = this.runs.get(launchId);
    if (existingRun) {
      return existingRun;
    }

    const timestamp = nowIso();
    const run: LaunchRun = {
      id: launchId,
      idea,
      status: 'queued',
      phase: 'draft',
      currentAgent: null,
      completedAgents: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      memory: createEmptyMemory(),
      report: null,
      error: null,
      pendingQuestions: [],
      pendingReason: null,
      clarificationAnswers: [],
      questionContext: [],
      selectedVisualConcept: null,
    };

    this.runs.set(launchId, run);
    this.persist();
    return run;
  }

  ensureRun(idea: string, launchId: string): LaunchRun {
    return this.getRun(launchId) ?? this.createRun(idea, launchId);
  }

  getRun(launchId: string): LaunchRun | undefined {
    return this.runs.get(launchId);
  }

  requireRun(launchId: string): LaunchRun {
    const run = this.getRun(launchId);
    if (!run) {
      throw new Error(`Launch run ${launchId} was not found.`);
    }
    return run;
  }

  read(launchId: string): OpenClawMemory {
    return this.requireRun(launchId).memory;
  }

  readSection<TKey extends WritableSection>(launchId: string, key: TKey): OpenClawMemory[TKey] {
    return this.requireRun(launchId).memory[key];
  }

  async recall(query: string, launchId: string): Promise<string[]> {
    const results = await this.client.search(query, launchId, 5);
    return results.map(result => result.memory);
  }

  async write<TKey extends WritableSection>(
    launchId: string,
    key: TKey,
    value: OpenClawMemory[TKey],
    agent: string,
    action = `write:${key}`,
  ): Promise<LaunchRun> {
    const run = this.requireRun(launchId);
    run.memory[key] = value;
    this.appendAuditLog(launchId, agent, action, [String(key)]);
    run.updatedAt = nowIso();
    this.persist();
    await this.client.add(
      [
        {
          role: 'assistant',
          content: JSON.stringify({
            key,
            value,
          }),
        },
      ],
      launchId,
      {
        agent,
        section: String(key),
        runId: launchId,
      },
    );
    return run;
  }

  async writeSection<TKey extends WritableSection>(
    launchId: string,
    key: TKey,
    value: OpenClawMemory[TKey],
    agent: string,
    action = `write:${key}`,
  ): Promise<LaunchRun> {
    return this.write(launchId, key, value, agent, action);
  }

  appendAuditLog(launchId: string, agent: string, action: string, keysWritten: string[]): LaunchRun {
    const run = this.requireRun(launchId);
    run.memory.audit_log.push({
      agent,
      action,
      timestamp: nowIso(),
      keys_written: keysWritten,
    });
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  updateStatus(launchId: string, currentAgent: string): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'running';
    run.phase = 'workflow';
    run.currentAgent = currentAgent;
    run.error = null;
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  requestHumanInput(launchId: string, questions: ClarificationPrompt[], reason: string, agent = 'orchestrator-agent'): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'awaiting-user-input';
    run.phase = 'clarification';
    run.currentAgent = agent;
    run.pendingQuestions = questions;
    run.questionContext = questions;
    run.pendingReason = reason;
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  recordHumanAnswers(
    launchId: string,
    answers: string[],
    normalizedAnswers: ClarificationAnswer[],
    agent = 'orchestrator-agent',
  ): LaunchRun {
    const run = this.requireRun(launchId);
    run.clarificationAnswers = answers;
    run.pendingQuestions = [];
    run.pendingReason = null;
    run.status = 'queued';
    run.phase = 'draft';
    run.questionContext = [];

    if (run.memory.idea) {
      run.memory.idea.clarification_answers = answers;
    }
    run.memory.brief = {
      answers: normalizedAnswers,
      founder_brief: normalizedAnswers.map(answer => `${answer.question}: ${answer.answer}`).join('\n'),
    };

    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  recordDelegation(launchId: string, agentId: string, task: string, delegatedBy = 'orchestrator-agent'): LaunchRun {
    const run = this.requireRun(launchId);
    run.currentAgent = agentId;
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  markAgentCompleted(launchId: string, agent: string): LaunchRun {
    const run = this.requireRun(launchId);
    if (!run.completedAgents.includes(agent)) {
      run.completedAgents.push(agent);
    }
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  async completeRun(launchId: string, report: LaunchBible): Promise<LaunchRun> {
    const run = this.requireRun(launchId);
    run.status = 'completed';
    run.phase = 'completed';
    run.currentAgent = 'launch-report-agent';
    run.report = report;
    this.appendAuditLog(launchId, 'launch-report-agent', 'complete-launch', ['report']);
    this.markAgentCompleted(launchId, 'launch-report-agent');
    run.updatedAt = nowIso();
    this.persist();
    await this.client.add(
      [
        {
          role: 'assistant',
          content: JSON.stringify({
            key: 'report',
            value: report,
          }),
        },
      ],
      launchId,
      {
        agent: 'launch-report-agent',
        section: 'report',
        runId: launchId,
      },
    );
    return run;
  }

  failRun(launchId: string, error: unknown): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'failed';
    run.phase = 'failed';
    run.error = error instanceof Error ? error.message : String(error);
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  setSelectedVisualConcept(launchId: string, conceptIndex: number): LaunchRun {
    const run = this.requireRun(launchId);
    run.selectedVisualConcept = conceptIndex;
    run.phase = 'visual-selection';
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }
}

const globals = globalThis as OpenClawGlobals;

export const mem0 = globals.__openclawMem0 ?? new OpenClawMem0();

if (!globals.__openclawMem0) {
  globals.__openclawMem0 = mem0;
}
