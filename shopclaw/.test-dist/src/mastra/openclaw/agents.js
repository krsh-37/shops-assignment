import { Agent } from '@mastra/core/agent';
import { adsStrategyTool, domainRankingTool, gtmPlanTool, launchReportTool, researchTool, seoGeoTool, shopifyAssetsTool, visualDirectionTool, } from './tools.js';
const defaultModel = 'openai/gpt-5.4';
export const orchestratorAgent = new Agent({
    id: 'openclaw-orchestrator',
    name: 'OpenClaw Orchestrator',
    instructions: 'You coordinate the OpenClaw launch workflow. Read shared memory before delegating, batch clarification questions, avoid duplicate asks, and keep the run status coherent.',
    model: defaultModel,
});
export const researchAgent = new Agent({
    id: 'research-agent',
    name: 'Research Agent',
    instructions: 'You produce India-aware market analysis, competitor mapping, whitespace, TAM framing, and keyword guidance for a new launch idea.',
    model: defaultModel,
    tools: { researchTool },
});
export const domainAgent = new Agent({
    id: 'domain-agent',
    name: 'Domain Agent',
    instructions: 'You generate brand names, check domain availability stubs, and rank the strongest shortlist by fit, memorability, and launch readiness.',
    model: defaultModel,
    tools: { domainRankingTool },
});
export const visualAgent = new Agent({
    id: 'visual-agent',
    name: 'Visual Agent',
    instructions: 'You generate three brand identity directions, logo prompts, palette decisions, and a chosen concept rooted in prior research.',
    model: defaultModel,
    tools: { visualDirectionTool },
});
export const gtmAgent = new Agent({
    id: 'gtm-agent',
    name: 'India GTM Agent',
    instructions: 'You create an India-first launch plan with city priority, channel mix, reel hooks, influencer strategy, and week-one activation tasks.',
    model: defaultModel,
    tools: { gtmPlanTool },
});
export const shopifyAgent = new Agent({
    id: 'shopify-agent',
    name: 'Shopify Agent',
    instructions: 'You turn visual, research, and GTM memory into usable Shopify theme, product, homepage, and collection payloads.',
    model: defaultModel,
    tools: { shopifyAssetsTool },
});
export const adsAgent = new Agent({
    id: 'ads-agent',
    name: 'Performance Ads Agent',
    instructions: 'You create Meta and Google launch strategy from the shared brand context without re-asking for already-known information.',
    model: defaultModel,
    tools: { adsStrategyTool },
});
export const seoAgent = new Agent({
    id: 'seo-agent',
    name: 'SEO GEO Agent',
    instructions: 'You generate search and AI-discoverability outputs, including keyword strategy, FAQs, and content planning.',
    model: defaultModel,
    tools: { seoGeoTool },
});
export const launchReportAgent = new Agent({
    id: 'launch-report-agent',
    name: 'Launch Report Agent',
    instructions: 'You synthesize all prior memory into a single launch bible that is coherent, traceable, and launch ready.',
    model: defaultModel,
    tools: { launchReportTool },
});
