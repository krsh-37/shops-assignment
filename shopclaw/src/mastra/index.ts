import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter } from '@mastra/observability';
import { getMastraStorageUrl, isDevMode } from './config/openclaw-config.js';
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
  askUserTool,
  delegateToAgentTool,
  domainIdeationTool,
  domainRankingTool,
  fetchPageTool,
  getLaunchStatusTool,
  gtmPlanTool,
  launchReportTool,
  logoGenerationTool,
  mem0ReadTool,
  mem0WriteTool,
  researchTool,
  resumeLaunchWorkflowTool,
  seoGeoTool,
  shopifyAssetsTool,
  startLaunchWorkflowTool,
  visualDirectionTool,
} from './tools/index.js';
import { openclawWorkflow } from './workflows/openclaw.js';

const storagePath = getMastraStorageUrl();
const exposeAgents = isDevMode();

export const mastra = new Mastra({
  workflows: {
    openclawWorkflow,
  },
  agents: exposeAgents
    ? {
        orchestratorAgent,
        researchAgent,
        domainAgent,
        visualAgent,
        gtmAgent,
        shopifyAgent,
        adsAgent,
        seoAgent,
        launchReportAgent,
      }
    : {},
  tools: {
    researchTool,
    fetchPageTool,
    domainRankingTool,
    domainIdeationTool,
    visualDirectionTool,
    logoGenerationTool,
    gtmPlanTool,
    shopifyAssetsTool,
    adsStrategyTool,
    seoGeoTool,
    launchReportTool,
    mem0ReadTool,
    mem0WriteTool,
    askUserTool,
    delegateToAgentTool,
    startLaunchWorkflowTool,
    resumeLaunchWorkflowTool,
    getLaunchStatusTool,
  },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: storagePath,
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'openclaw',
        exporters: [new DefaultExporter()],
      },
    },
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  server: {
    apiRoutes: openclawApiRoutes,
  },
});
