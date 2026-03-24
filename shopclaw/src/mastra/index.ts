import { resolve } from 'node:path';
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { openclawApiRoutes } from './api/openclaw-routes.js';
import {
  adsAgent,
  domainAgent,
  gtmAgent,
  launchReportAgent,
  orchestratorAgent,
  researchAgent,
  seoAgent,
  shopifyAgent,
  visualAgent,
} from './agents/index.js';
import {
  adsStrategyTool,
  domainRankingTool,
  gtmPlanTool,
  launchReportTool,
  researchTool,
  seoGeoTool,
  shopifyAssetsTool,
  visualDirectionTool,
} from './tools/index.js';
import { openclawWorkflow } from './workflows/openclaw.js';

const storagePath = `file:${resolve(process.cwd(), 'mastra.db')}`;

export const mastra = new Mastra({
  workflows: { openclawWorkflow },
  agents: {
    orchestratorAgent,
    researchAgent,
    domainAgent,
    visualAgent,
    gtmAgent,
    shopifyAgent,
    adsAgent,
    seoAgent,
    launchReportAgent,
  },
  tools: {
    researchTool,
    domainRankingTool,
    visualDirectionTool,
    gtmPlanTool,
    shopifyAssetsTool,
    adsStrategyTool,
    seoGeoTool,
    launchReportTool,
  },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: storagePath,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
  server: {
    apiRoutes: openclawApiRoutes,
  },
});
