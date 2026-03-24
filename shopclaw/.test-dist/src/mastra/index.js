import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { adsAgent, domainAgent, gtmAgent, launchReportAgent, orchestratorAgent, researchAgent, seoAgent, shopifyAgent, visualAgent, } from './openclaw/agents.js';
import { launchRoutes } from './openclaw/routes.js';
import { adsStrategyTool, domainRankingTool, gtmPlanTool, launchReportTool, researchTool, seoGeoTool, shopifyAssetsTool, visualDirectionTool, } from './openclaw/tools.js';
import { openclawWorkflow } from './openclaw/workflow.js';
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
        id: "mastra-storage",
        // stores observability, scores, ... into persistent file storage
        url: "file:./mastra.db",
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
        apiRoutes: launchRoutes,
    },
});
