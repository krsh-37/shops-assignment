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
import { logRuntime } from '../utils/runtime-log.js';

type WritableSection = Exclude<keyof OpenClawMemory, 'audit_log'>;
type OpenClawGlobals = typeof globalThis & {
  __openclawMem0?: OpenClawMem0;
};

function nowIso(): string {
  return new Date().toISOString();
}

function isWritableSection(value: string): value is WritableSection {
  return value !== 'audit_log' && value in createEmptyMemory();
}

function buildFieldEntries<TKey extends WritableSection>(
  section: TKey,
  value: OpenClawMemory[TKey],
): Array<{ path: string; value: unknown }> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [{ path: String(section), value }];
  }

  const entries = Object.entries(value).map(([key, childValue]) => ({
    path: `${String(section)}.${key}`,
    value: childValue,
  }));

  return [{ path: String(section), value }, ...entries];
}

function compactMetadataValue(value: unknown): string | undefined {
  try {
    const serialized = JSON.stringify(value);
    return serialized.length <= 1500 ? serialized : undefined;
  } catch {
    return undefined;
  }
}

function stableMem0UserId(run: LaunchRun): string {
  if (run.conversationThreadId?.trim()) {
    return `thread:${run.conversationThreadId.trim()}`;
  }

  return 'openclaw-default';
}

function summarizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'None.';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, 8)
      .map(item => `- ${summarizeValue(item)}`)
      .join('\n');
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .slice(0, 12)
      .map(([key, child]) => `- ${key}: ${summarizeValue(child)}`)
      .join('\n');
  }

  return String(value);
}

function summarizeInputsForSection(run: LaunchRun, key: WritableSection): string {
  const memory = run.memory;

  const lines = [
    `- founder_idea: ${run.idea || memory.idea?.raw || 'Founder idea not captured.'}`,
    memory.brief?.founder_brief ? `- founder_brief: ${memory.brief.founder_brief}` : null,
  ];

  const upstreamSections = Object.entries(memory)
    .filter(([section, value]) => section !== 'audit_log' && section !== key && value !== null)
    .slice(0, 6)
    .map(([section, value]) => `- ${section}: ${summarizeValue(value)}`);

  return [...lines, ...upstreamSections].filter((line): line is string => Boolean(line)).join('\n');
}

function explainAgentPurpose(key: WritableSection, agent: string): string {
  const sectionPurpose: Record<WritableSection, string> = {
    idea: 'capture the founder intent and normalize the launch starting point',
    brief: 'preserve the founder clarifications that downstream agents must follow',
    research: 'ground the launch in market context, competitors, whitespace, and keyword demand',
    visual: 'turn the founder brief into a brand direction, palette, and logo concepts',
    domains: 'translate the brand direction into a ranked domain shortlist',
    gtm: 'convert the brief and research into an India-first launch plan',
    shopify: 'translate the brand, offer, and GTM into a storefront package',
    ads: 'turn the GTM and brand inputs into paid acquisition creative and pacing',
    seo: 'turn the research and storefront into search- and GEO-ready content',
  };

  return `I am ${agent} and I am producing the ${String(key)} memory because this launch now needs it to ${sectionPurpose[key]}.`;
}

function buildSectionMemoryMessages(
  run: LaunchRun,
  key: WritableSection,
  value: OpenClawMemory[WritableSection],
  agent: string,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return [
    {
      role: 'user',
      content: `Founder request: ${run.idea || run.memory.idea?.raw || 'Founder idea not captured.'}`,
    },
    {
      role: 'user',
      content: [
        `Inputs for ${agent}:`,
        summarizeInputsForSection(run, key),
      ].join('\n'),
    },
    {
      role: 'assistant',
      content: explainAgentPurpose(key, agent),
    },
    {
      role: 'assistant',
      content: [
        `Output for ${String(key)}:`,
        summarizeValue(value),
      ].join('\n'),
    },
  ];
}

function getValueAtPath(source: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = source;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || Array.isArray(current) || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
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

function getAgentRunDir(launchId: string): string {
  return resolve(process.cwd(), '.openclaw', 'agent-run', launchId);
}

function writeAgentRunArtifact(launchId: string, agent: string, payload: unknown): void {
  const directory = getAgentRunDir(launchId);
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    resolve(directory, `${agent}.json`),
    JSON.stringify(
      {
        launchId,
        agent,
        generatedAt: nowIso(),
        output: payload,
      },
      null,
      2,
    ),
  );
}

function normalizePersistedRun(raw: any): LaunchRun {
  raw.pendingQuestions ??= [];
  raw.pendingReason ??= null;
  raw.clarificationAnswers ??= [];
  raw.conversationThreadId ??= null;
  raw.phase ??= 'draft';
  raw.questionContext ??= raw.pendingQuestions;
  raw.selectedVisualConcept ??= null;
  raw.memory ??= createEmptyMemory();
  raw.memory.brief ??= null;

  if (raw?.memory?.idea) {
    raw.memory.idea.clarification_answers ??= raw.clarificationAnswers;
  }

  if (raw?.memory?.visual) {
    raw.memory.visual.brand_name ??= raw.memory.domains?.top5?.[0]?.name ?? raw.memory.idea?.brand_name_candidates?.[0] ?? 'Legacy Brand';
    raw.memory.visual.logo_concepts ??= [
      {
        name: 'Legacy Concept 1',
        mood: 'bold',
        prompt: 'Migrated legacy logo concept.',
        image_url: 'https://assets.openclaw.local/legacy-concept-1.png',
      },
      {
        name: 'Legacy Concept 2',
        mood: 'premium',
        prompt: 'Migrated legacy logo concept.',
        image_url: 'https://assets.openclaw.local/legacy-concept-2.png',
      },
      {
        name: 'Legacy Concept 3',
        mood: 'playful',
        prompt: 'Migrated legacy logo concept.',
        image_url: 'https://assets.openclaw.local/legacy-concept-3.png',
      },
    ];
    raw.memory.visual.chosen_concept ??= raw.selectedVisualConcept ?? 0;
    raw.memory.visual.palette ??= ['#000000', '#ffffff', '#cccccc'];
    raw.memory.visual.font_pairing ??= 'Legacy Sans + Legacy Sans';
    raw.memory.visual.mood ??= 'legacy';
  }

  if (raw?.memory?.shopify) {
    raw.memory.shopify.theme_settings ??= {
      theme: 'Legacy',
      palette: ['#000000', '#ffffff', '#cccccc'],
      fonts: { heading: 'Legacy Sans', body: 'Legacy Sans' },
      hero_cta: 'Legacy CTA',
    };
    raw.memory.shopify.products ??= [];
    raw.memory.shopify.homepage ??= {
      hero_headline: 'Legacy hero',
      hero_subheadline: 'Legacy subheadline',
      value_props: ['Legacy prop 1', 'Legacy prop 2', 'Legacy prop 3'],
    };
    raw.memory.shopify.collections ??= [];
    raw.memory.shopify.files ??= [
      { path: '/shopify/theme-settings.json', content: '{}', kind: 'json' },
      { path: '/shopify/products.json', content: '[]', kind: 'json' },
      { path: '/shopify/homepage-sections.json', content: '{}', kind: 'json' },
      { path: '/shopify/collections.json', content: '[]', kind: 'json' },
    ];
    raw.memory.shopify.package_summary ??= 'Migrated legacy Shopify package.';
  }

  if (raw?.memory?.domains) {
    raw.memory.domains.candidates15 ??= Array.from({ length: 15 }, (_, index) => {
      const fallback = raw.memory.domains?.top5?.[index] ?? raw.memory.domains?.top5?.[index % Math.max(raw.memory.domains?.top5?.length ?? 1, 1)] ?? {
        name: `LegacyBrand${index + 1}`,
        domain: `legacybrand${index + 1}.in`,
        available: index % 4 !== 0,
        price_inr: 699 + index * 50,
        score: Math.max(40, 90 - index * 3),
        reasoning: 'Migrated legacy shortlist entry.',
      };

      return {
        ...fallback,
        name: fallback.name ?? `LegacyBrand${index + 1}`,
        domain: fallback.domain ?? `legacybrand${index + 1}.in`,
      };
    });
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

  if (raw?.memory?.ads) {
    raw.memory.ads.meta_ads ??= Array.from({ length: 3 }, (_, index) => ({
      format: `Legacy format ${index + 1}`,
      hook: `Legacy hook ${index + 1}`,
      body: `Legacy body ${index + 1}`,
      cta: 'Legacy CTA',
      audience: 'Legacy audience',
      budget_day_inr: 500,
    }));
    raw.memory.ads.google_campaigns ??= Array.from({ length: 2 }, (_, index) => ({
      name: `Legacy campaign ${index + 1}`,
      budget_day_inr: 500,
      ad_groups: [
        {
          name: `Legacy ad group ${index + 1}`,
          keywords: ['legacy keyword'],
          match_type: 'phrase',
        },
      ],
    }));
    raw.memory.ads.pacing_plan ??= {
      start_budget_day_inr: 500,
      scale_trigger: 'Legacy trigger',
      milestones: ['Legacy milestone 1', 'Legacy milestone 2', 'Legacy milestone 3'],
    };
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
      conversationThreadId: null,
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

  listRuns(): LaunchRun[] {
    return [...this.runs.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  findRuns(predicate: (run: LaunchRun) => boolean): LaunchRun[] {
    return this.listRuns().filter(predicate);
  }

  bindThreadToLaunch(launchId: string, threadId: string): LaunchRun {
    for (const candidate of this.runs.values()) {
      if (candidate.id !== launchId && candidate.conversationThreadId === threadId) {
        candidate.conversationThreadId = null;
        candidate.updatedAt = nowIso();
      }
    }

    const run = this.requireRun(launchId);
    run.conversationThreadId = threadId;
    run.updatedAt = nowIso();
    this.persist();
    return run;
  }

  getActiveLaunchForThread(threadId: string, phase?: LaunchRun['phase']): LaunchRun | undefined {
    return this.findRuns(run => {
      if (run.conversationThreadId !== threadId) {
        return false;
      }

      if (phase) {
        return run.phase === phase;
      }

      return run.status === 'awaiting-user-input' || run.status === 'running' || run.status === 'queued';
    })[0];
  }

  getLatestLaunchForThread(threadId: string): LaunchRun | undefined {
    return this.findRuns(run => run.conversationThreadId === threadId)[0];
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

  private extractPersistedSection(record: {
    memory?: string;
    metadata?: Record<string, unknown>;
    messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): { key: WritableSection; value: OpenClawMemory[WritableSection] } | null {
    const section = typeof record.metadata?.section === 'string' ? record.metadata.section : undefined;
    const path = typeof record.metadata?.path === 'string' ? record.metadata.path : undefined;

    const candidates = [
      ...(record.messages?.map(message => message.content) ?? []),
      record.memory,
    ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as { key?: string; path?: string; value?: unknown };
        const candidateKey = typeof parsed.key === 'string' ? parsed.key : typeof parsed.path === 'string' ? parsed.path : undefined;
        if (
          typeof candidateKey === 'string' &&
          isWritableSection(candidateKey) &&
          parsed.value !== undefined &&
          (!path || path === section || path === candidateKey)
        ) {
          return {
            key: candidateKey,
            value: parsed.value as OpenClawMemory[WritableSection],
          };
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  async hydrateSharedMemory(launchId: string): Promise<OpenClawMemory> {
    const hydrated = createEmptyMemory();
    const run = this.requireRun(launchId);
    hydrated.audit_log = run.memory.audit_log;

    const records = await this.client.getAll(stableMem0UserId(run), launchId);
    for (const record of records) {
      const persisted = this.extractPersistedSection(record);
      if (!persisted) {
        continue;
      }

      hydrated[persisted.key] = persisted.value as never;
    }

    if (!hydrated.idea && run.memory.idea) {
      hydrated.idea = run.memory.idea;
    }

    if (!hydrated.brief && run.memory.brief) {
      hydrated.brief = run.memory.brief;
    }

    if (!hydrated.visual && run.memory.visual) {
      hydrated.visual = run.memory.visual;
    } else if (hydrated.visual && run.selectedVisualConcept !== null) {
      hydrated.visual.chosen_concept = run.selectedVisualConcept;
    }

    logRuntime('mem0.hydrate', {
      launchId,
      available_sections: Object.entries(hydrated)
        .filter(([key, value]) => key !== 'audit_log' && value !== null)
        .map(([key]) => key),
      source: 'mem0',
    });

    return hydrated;
  }

  async hydrateSharedSection<TKey extends WritableSection>(launchId: string, key: TKey): Promise<OpenClawMemory[TKey]> {
    const memory = await this.hydrateSharedMemory(launchId);
    return memory[key];
  }

  async readPaths(launchId: string, paths: string[]): Promise<Record<string, unknown>> {
    const requested = new Set(paths);
    const values: Record<string, unknown> = {};
    const run = this.requireRun(launchId);
    const records = await this.client.getAll(stableMem0UserId(run), launchId);

    for (const record of records) {
      const metadataPath = typeof record.metadata?.path === 'string' ? record.metadata.path : undefined;
      if (!metadataPath || !requested.has(metadataPath)) {
        continue;
      }
    }

    const localMemory = run.memory as unknown as Record<string, unknown>;
    for (const path of paths) {
      if (path in values) {
        continue;
      }

      const localValue = getValueAtPath(localMemory, path);
      if (localValue !== undefined) {
        values[path] = localValue;
      }
    }

    logRuntime('mem0.read-paths', {
      launchId,
      requested_paths: paths,
      resolved_paths: Object.keys(values),
      fallback_source: 'local-run-memory-for-missing-paths',
    });

    return values;
  }

  async recall(query: string, launchId: string): Promise<string[]> {
    const run = this.requireRun(launchId);
    const results = await this.client.search(query, stableMem0UserId(run), launchId, 5);
    const memories = results.map(result => result.memory);
    logRuntime('mem0.recall', {
      launchId,
      query,
      hit_count: memories.length,
      results: memories,
    });
    return memories;
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
    logRuntime('mem0.write', {
      launchId,
      agent,
      action,
      section: key,
      value,
    });
    const userId = stableMem0UserId(run);
    await this.client.add(
      buildSectionMemoryMessages(run, key, value, agent),
      userId,
      launchId,
      {
        agent,
        section: String(key),
        runId: launchId,
        path: String(key),
      },
    );

    await Promise.all(
      buildFieldEntries(key, value).slice(1).map(entry => {
        return this.client.add(
          [
            {
              role: 'user',
              content: `Founder request: ${run.idea || run.memory.idea?.raw || 'Founder idea not captured.'}`,
            },
            {
              role: 'user',
              content: [
                `Inputs for ${agent}:`,
                summarizeInputsForSection(run, key),
              ].join('\n'),
            },
            {
              role: 'assistant',
              content: `I am ${agent} and I am recording the focused memory path ${entry.path} so later agents can retrieve just this input without loading the whole section.`,
            },
            {
              role: 'assistant',
              content: `Output for ${entry.path}:\n${summarizeValue(entry.value)}`,
            },
          ],
          userId,
          launchId,
          {
            agent,
            section: String(key),
            path: entry.path,
            runId: launchId,
          },
        );
      }),
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

  requestVisualSelection(launchId: string, agent = 'visual-agent'): LaunchRun {
    const run = this.requireRun(launchId);
    run.status = 'awaiting-user-input';
    run.phase = 'visual-selection';
    run.currentAgent = agent;
    run.pendingQuestions = [];
    run.questionContext = [];
    run.pendingReason = 'Select one of the three visual concepts before continuing the launch.';
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
    logRuntime('mem0.answers', {
      launchId,
      agent,
      answers,
      normalized_answers: normalizedAnswers,
    });
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
    const writtenSections = Object.entries(run.memory)
      .filter(([key, value]) => key !== 'audit_log' && value !== null)
      .map(([key]) => key);
    const sectionKey = agentSectionKey(agent);
    const latestOutput = sectionKey ? run.memory[sectionKey] : null;
    if (latestOutput !== null) {
      writeAgentRunArtifact(launchId, agent, latestOutput);
    }
    logRuntime('agent.completed', {
      launchId,
      agent,
      completed_agents: run.completedAgents,
      available_sections: writtenSections,
      latest_output: latestOutput,
    });
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
    writeAgentRunArtifact(launchId, 'launch-report-agent', report);
    logRuntime('launch.completed', {
      launchId,
      report,
    });
    await this.client.add(
      [
        {
          role: 'user',
          content: `Founder request: ${run.idea || run.memory.idea?.raw || 'Founder idea not captured.'}`,
        },
        {
          role: 'user',
          content: [
            'Inputs for launch-report-agent:',
            summarizeInputsForSection(run, 'seo'),
          ].join('\n'),
        },
        {
          role: 'assistant',
          content: 'I am launch-report-agent and I am consolidating the completed agent outputs into the final launch bible so the founder has one coherent deliverable.',
        },
        {
          role: 'assistant',
          content: `Output for report:\n${summarizeValue(report)}`,
        },
      ],
      stableMem0UserId(run),
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
    run.pendingReason = null;
    run.pendingQuestions = [];
    run.questionContext = [];
    run.status = 'queued';
    run.phase = 'workflow';

    if (run.memory.visual) {
      run.memory.visual.chosen_concept = conceptIndex;
    }

    run.updatedAt = nowIso();
    this.persist();
    logRuntime('visual.selected', {
      launchId,
      conceptIndex,
      concept: run.memory.visual?.logo_concepts?.[conceptIndex] ?? null,
    });
    return run;
  }
}

function agentSectionKey(agent: string): keyof OpenClawMemory | null {
  switch (agent) {
    case 'orchestrator-agent':
      return 'idea';
    case 'research-agent':
      return 'research';
    case 'visual-agent':
      return 'visual';
    case 'domain-agent':
      return 'domains';
    case 'gtm-agent':
      return 'gtm';
    case 'shopify-agent':
      return 'shopify';
    case 'ads-agent':
      return 'ads';
    case 'seo-agent':
      return 'seo';
    default:
      return null;
  }
}

const globals = globalThis as OpenClawGlobals;

export const mem0 = globals.__openclawMem0 ?? new OpenClawMem0();

if (!globals.__openclawMem0) {
  globals.__openclawMem0 = mem0;
}
