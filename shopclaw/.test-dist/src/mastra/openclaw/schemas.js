import { z } from 'zod';
export const clarificationSchema = z.object({
    question: z.string(),
    assumption: z.string(),
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
    price_inr: z.number().int().positive(),
    score: z.number().min(0).max(100),
    reasoning: z.string(),
});
export const domainMemorySchema = z.object({
    recommended: z.string(),
    top5: z.array(domainResultSchema).length(5),
});
export const gtmMemorySchema = z.object({
    launch_cities: z.array(z.string()).min(3),
    channels: z.object({
        instagram: z.string(),
        whatsapp: z.string(),
        google: z.string(),
    }),
    reel_ideas: z.array(z.string()).length(10),
    influencer_brief: z.string(),
    week1_checklist: z.array(z.string()).min(5),
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
    products: z.array(z.object({
        title: z.string(),
        price_inr: z.number().int().positive(),
        description: z.string(),
        tags: z.array(z.string()),
    })),
    homepage: z.object({
        hero_headline: z.string(),
        hero_subheadline: z.string(),
        value_props: z.array(z.string()).length(3),
    }),
    collections: z.array(z.object({
        name: z.string(),
        handle: z.string(),
        description: z.string(),
    })),
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
    ad_groups: z.array(z.object({
        name: z.string(),
        keywords: z.array(z.string()),
        match_type: z.enum(['broad', 'phrase', 'exact']),
    })),
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
});
export const openClawMemorySchema = z.object({
    idea: ideaMemorySchema.nullable(),
    research: researchMemorySchema.nullable(),
    visual: visualMemorySchema.nullable(),
    domains: domainMemorySchema.nullable(),
    gtm: gtmMemorySchema.nullable(),
    shopify: shopifyMemorySchema.nullable(),
    ads: adsMemorySchema.nullable(),
    seo: seoMemorySchema.nullable(),
    audit_log: z.array(auditLogSchema),
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
    markdown: z.string(),
});
export const launchInputSchema = z.object({
    launchId: z.string(),
    idea: z.string().min(10),
});
export const launchTokenSchema = z.object({
    launchId: z.string(),
});
export const launchStatusSchema = z.enum(['queued', 'running', 'completed', 'failed']);
export const launchRunSchema = z.object({
    id: z.string(),
    idea: z.string(),
    status: launchStatusSchema,
    currentAgent: z.string().nullable(),
    completedAgents: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
    memory: openClawMemorySchema,
    report: launchBibleSchema.nullable(),
    error: z.string().nullable(),
});
export function createEmptyMemory() {
    return {
        idea: null,
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
