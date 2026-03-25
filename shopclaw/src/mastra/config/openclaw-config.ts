import { z } from 'zod';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

const modeSchema = z.enum(['staging', 'dev']).default('staging');

const baseSchema = z.object({
  OPENCLAW_MODE: modeSchema.optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  MEM0_API_KEY: z.string().optional(),
  MEM0_ORG_ID: z.string().optional(),
  MEM0_PROJECT_ID: z.string().optional(),
});

export type OpenClawMode = 'staging' | 'dev';

export type OpenClawConfig = {
  mode: OpenClawMode;
  googleApiKey?: string;
  tavilyApiKey?: string;
  mem0ApiKey?: string;
  mem0OrgId?: string;
  mem0ProjectId?: string;
};

let cachedConfig: OpenClawConfig | undefined;

function requireValue(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getOpenClawConfig(): OpenClawConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const env = baseSchema.parse(process.env);
  const mode = modeSchema.parse(env.OPENCLAW_MODE ?? 'staging');

  if (mode === 'dev') {
    cachedConfig = {
      mode,
      googleApiKey: requireValue('GOOGLE_GENERATIVE_AI_API_KEY', env.GOOGLE_GENERATIVE_AI_API_KEY),
      tavilyApiKey: requireValue('TAVILY_API_KEY', env.TAVILY_API_KEY),
      mem0ApiKey: requireValue('MEM0_API_KEY', env.MEM0_API_KEY),
      mem0OrgId: requireValue('MEM0_ORG_ID', env.MEM0_ORG_ID),
      mem0ProjectId: requireValue('MEM0_PROJECT_ID', env.MEM0_PROJECT_ID),
    };

    return cachedConfig;
  }

  cachedConfig = {
    mode,
    googleApiKey: env.GOOGLE_GENERATIVE_AI_API_KEY,
    tavilyApiKey: env.TAVILY_API_KEY,
    mem0ApiKey: env.MEM0_API_KEY,
    mem0OrgId: env.MEM0_ORG_ID,
    mem0ProjectId: env.MEM0_PROJECT_ID,
  };

  return cachedConfig;
}

export function isDevMode(): boolean {
  return getOpenClawConfig().mode === 'dev';
}

export function assertStagingMode(toolId: string): void {
  if (isDevMode()) {
    throw new Error(`${toolId} is staging-only. In dev mode, use the real agent/workflow execution path instead of stub tools.`);
  }
}

export function getMastraStorageUrl(): string {
  if (isDevMode()) {
    const path = resolve(process.cwd(), '.openclaw', 'mastra-dev.db');
    mkdirSync(dirname(path), { recursive: true });
    return `file:${path}`;
  }

  return `file:${resolve(tmpdir(), `openclaw-mastra-${process.pid}.db`)}`;
}
