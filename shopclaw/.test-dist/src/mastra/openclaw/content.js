function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function titleCase(value) {
    return value
        .split(/[\s-]+/)
        .filter(Boolean)
        .map(part => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}
export function inferCategory(idea) {
    const normalized = idea.toLowerCase();
    if (normalized.includes('deliver') || normalized.includes('10 minutes') || normalized.includes('quick')) {
        return 'quick-commerce fashion';
    }
    if (normalized.includes('beauty') || normalized.includes('skincare')) {
        return 'beauty d2c';
    }
    return 'd2c lifestyle';
}
export function buildClarifications(idea) {
    const category = inferCategory(idea);
    return [
        {
            question: 'What cities in India should we prioritise first?',
            assumption: category === 'quick-commerce fashion'
                ? 'Assuming Bengaluru, Mumbai, and Pune are the phase-one launch cities.'
                : 'Assuming Bengaluru, Mumbai, and Delhi are the phase-one launch cities.',
        },
        {
            question: 'What price point are we targeting?',
            assumption: 'Assuming an accessible premium launch price band of Rs 399 to Rs 799.',
        },
        {
            question: 'Is this direct-to-consumer only or open to quick-commerce channels?',
            assumption: category === 'quick-commerce fashion'
                ? 'Assuming D2C first with quick-commerce partnerships explored in phase two.'
                : 'Assuming D2C first with marketplaces as a later expansion channel.',
        },
    ];
}
export function generateBrandCandidates(idea) {
    const normalized = idea.toLowerCase();
    if (normalized.includes('sock')) {
        return ['Sockzy', 'Pairly', 'Feetsy', 'DashSock', 'Looplane'];
    }
    const root = titleCase(slugify(idea).split('-').slice(0, 2).join(' ')) || 'LaunchLab';
    return [root.replace(/\s+/g, ''), `${root.split(' ')[0]}ly`, `${root.split(' ')[0]}Co`];
}
export function buildResearch(idea, memory) {
    const baseKeyword = idea.toLowerCase().includes('sock') ? 'custom socks india' : `${slugify(idea)} india`;
    return {
        competitors: [
            {
                name: 'Bombay Sock Company',
                region: 'India',
                positioning: 'giftable premium socks',
                notes: 'Strong design language but weaker instant-delivery positioning.',
            },
            {
                name: 'SuperSox',
                region: 'India',
                positioning: 'youth-focused patterned socks',
                notes: 'Good D2C merchandising but limited urgency-led messaging.',
            },
            {
                name: 'Zepto',
                region: 'India',
                positioning: 'quick-commerce expectation setter',
                notes: 'Not a direct competitor in socks, but defines delivery speed expectations.',
            },
        ],
        market_size_inr: 'Rs 1,200 crore+ annual addressable opportunity across urban socks and gifting segments.',
        whitespace: 'Own the intersection of expressive design, instant gratification, and gifting convenience for tier-1 urban buyers.',
        keywords: {
            primary: [baseKeyword, '10 minute delivery socks', 'premium socks india'],
            secondary: ['gift socks online', 'same day socks', 'quirky socks india', memory.idea?.category ?? 'd2c fashion'],
        },
        india_insight: 'Fast-delivery expectations are now normalized by grocery apps, creating room for a specialized brand that turns urgency into novelty and repeat gifting.',
    };
}
export function buildDomainOptions(memory) {
    const candidates = memory.idea?.brand_name_candidates ?? ['Sockzy', 'Pairly', 'Feetsy', 'DashSock', 'Looplane'];
    const ranked = candidates.slice(0, 5).map((name, index) => {
        const domain = `${slugify(name)}.in`;
        const available = index !== 3;
        const score = 92 - index * 7;
        return {
            name,
            domain,
            available,
            price_inr: 699 + index * 100,
            score,
            reasoning: available
                ? `${name} is short, brandable, and strong for India-first recall.`
                : `${name} is memorable but likely conflicted, so it is better used as a fallback.`,
        };
    });
    const recommended = ranked.find(item => item.available)?.domain ?? ranked[0].domain;
    return {
        recommended,
        top5: ranked,
    };
}
export function buildVisualDirection(memory) {
    const brandName = memory.idea?.brand_name_candidates?.[0] ?? 'Sockzy';
    const mood = 'playful';
    const palette = ['#FF6A3D', '#102A43', '#F0F4F8', '#17B890'];
    return {
        brand_name: brandName,
        logo_concepts: [
            {
                name: `${brandName} Sprint`,
                mood: 'bold',
                prompt: `Design a bold wordmark for ${brandName} with motion cues for fast delivery and expressive socks.`,
                image_url: `https://assets.openclaw.local/${slugify(brandName)}-concept-1.png`,
            },
            {
                name: `${brandName} Grid`,
                mood: 'premium',
                prompt: `Create a geometric icon plus sans-serif lockup for ${brandName} with urban premium cues.`,
                image_url: `https://assets.openclaw.local/${slugify(brandName)}-concept-2.png`,
            },
            {
                name: `${brandName} Mascot`,
                mood: 'playful',
                prompt: `Create an illustrated mascot-led logo for ${brandName} with a witty, energetic tone.`,
                image_url: `https://assets.openclaw.local/${slugify(brandName)}-concept-3.png`,
            },
        ],
        chosen_concept: 0,
        palette,
        font_pairing: 'Space Grotesk + Instrument Sans',
        mood,
    };
}
export function buildGTM(memory) {
    const brandName = memory.visual?.brand_name ?? memory.idea?.brand_name_candidates?.[0] ?? 'Sockzy';
    return {
        launch_cities: ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad'],
        channels: {
            instagram: '40%',
            whatsapp: '30%',
            google: '30%',
        },
        reel_ideas: [
            'Your socks arrive before your snack craving fades.',
            'Office outfit rescue in 10 minutes.',
            'Unboxing three sock moods for one week.',
            'Campus fit check powered by quick delivery.',
            'Gift a weirdly good pair in under 10 minutes.',
            'Premium socks, zero planning required.',
            'From cart to doorstep before the playlist ends.',
            'Three ways to style statement socks in India heat.',
            'Date-night save with last-minute accessories.',
            `${brandName} sprint challenge: order before the timer ends.`,
        ],
        influencer_brief: 'Prioritise nano and micro creators in Bengaluru and Mumbai with outfit-transition reels, hostel gifting moments, and urgency-led hooks.',
        week1_checklist: [
            'Lock hero SKU assortment and launch pricing.',
            'Seed 20 creators with gifting kits and a same-day delivery challenge.',
            'Set up WhatsApp opt-in flow for launch drops.',
            'Launch 10 urgency-led reels and 3 founder-story posts.',
            'Track CAC, repeat intent, and top city conversion by day.',
        ],
    };
}
export function buildShopify(memory) {
    const palette = memory.visual?.palette ?? ['#FF6A3D', '#102A43', '#F0F4F8'];
    const keywords = memory.research?.keywords.primary ?? ['custom socks india'];
    const brandName = memory.visual?.brand_name ?? 'Sockzy';
    return {
        theme_settings: {
            theme: 'Dawn',
            palette,
            fonts: {
                heading: memory.visual?.font_pairing.split(' + ')[0] ?? 'Space Grotesk',
                body: memory.visual?.font_pairing.split(' + ')[1] ?? 'Instrument Sans',
            },
            hero_cta: 'Get your pair in minutes',
        },
        products: [
            {
                title: `${brandName} Classic Rush`,
                price_inr: 399,
                description: `Everyday essentials designed around ${keywords[0]} with soft combed cotton comfort and fast gifting appeal.`,
                tags: ['classic', ...keywords.slice(0, 2)],
            },
            {
                title: `${brandName} Print Sprint`,
                price_inr: 549,
                description: `Statement prints built for impulse gifting, social reels, and shoppers looking for ${keywords[1] ?? keywords[0]}.`,
                tags: ['printed', ...keywords.slice(1, 3)],
            },
            {
                title: `${brandName} Premium Pair`,
                price_inr: 799,
                description: `A premium bundle that turns ${keywords[2] ?? keywords[0]} into a sharper unboxing and repeat-purchase experience.`,
                tags: ['premium', ...keywords.slice(0, 2)],
            },
        ],
        homepage: {
            hero_headline: `${brandName} delivers expressive socks at quick-commerce speed.`,
            hero_subheadline: 'A launch-ready storefront tuned for impulse gifting, city-first delivery, and premium everyday style.',
            value_props: ['Delivery-speed-led merchandising', 'India-first gifting hooks', 'Visual identity grounded in shared memory'],
        },
        collections: [
            {
                name: 'Everyday Essentials',
                handle: 'everyday-essentials',
                description: 'Fast-moving starter pairs for first purchase conversion.',
            },
            {
                name: 'Giftable Drops',
                handle: 'giftable-drops',
                description: 'Higher-margin designs for gifting and impulse checkout.',
            },
            {
                name: 'Premium Sets',
                handle: 'premium-sets',
                description: 'Bundles designed for AOV growth.',
            },
        ],
    };
}
export function buildAds(memory) {
    const brandName = memory.visual?.brand_name ?? 'Sockzy';
    return {
        meta_ads: [
            {
                format: 'Reel',
                hook: 'Your socks arrive before your food.',
                body: `${brandName} turns last-minute outfit panic into a 10-minute delivery win for tier-1 India shoppers.`,
                cta: 'Shop the launch drop',
                audience: '18-30, Bengaluru/Mumbai/Pune, streetwear + gifting + quick-commerce interests',
                budget_day_inr: 500,
            },
            {
                format: 'Static',
                hook: '10 minutes. Custom. Never boring.',
                body: `Launch with premium patterns, gifting-friendly bundles, and urgency-led creative tailored to ${memory.gtm?.launch_cities.join(', ') ?? 'India tier-1 cities'}.`,
                cta: 'See the bestsellers',
                audience: 'Students and young professionals seeking style upgrades',
                budget_day_inr: 650,
            },
            {
                format: 'Story',
                hook: 'A same-day gift that does not feel generic.',
                body: `${brandName} wins on speed and design, giving creators and gift buyers a stronger impulse story.`,
                cta: 'Order now',
                audience: 'Gift buyers, office workers, and college creators',
                budget_day_inr: 850,
            },
        ],
        google_campaigns: [
            {
                name: 'Custom Socks Intent',
                budget_day_inr: 400,
                ad_groups: [
                    {
                        name: 'Custom Socks',
                        keywords: ['custom socks india', 'premium socks india', 'printed socks india'],
                        match_type: 'phrase',
                    },
                    {
                        name: 'Fast Delivery',
                        keywords: ['10 minute delivery socks', 'same day socks india', 'urgent gift socks'],
                        match_type: 'exact',
                    },
                ],
            },
            {
                name: 'Gifting And Fashion',
                budget_day_inr: 350,
                ad_groups: [
                    {
                        name: 'Gift Socks',
                        keywords: ['gift socks online', 'quirky socks india', 'socks gift set'],
                        match_type: 'phrase',
                    },
                    {
                        name: 'Style Upgrade',
                        keywords: ['streetwear socks india', 'fashion socks men', 'premium ankle socks'],
                        match_type: 'broad',
                    },
                ],
            },
        ],
        pacing_plan: {
            start_budget_day_inr: 500,
            scale_trigger: 'Increase to Rs 2,000 per day once blended CAC stays below target for three consecutive days.',
            milestones: [
                'Days 1-7: validate top creative hook and best-performing city.',
                'Days 8-15: shift budget toward winning hook and exact-match search intent.',
                'Days 16-30: scale retargeting and bundle-focused creatives.',
            ],
        },
    };
}
export function buildSEO(memory) {
    const brandName = memory.visual?.brand_name ?? 'Sockzy';
    const primary = memory.research?.keywords.primary ?? ['custom socks india', '10 minute delivery socks'];
    return {
        keywords: [...primary, 'best socks brand india 2026', `${slugify(brandName)} socks`, 'gift socks india'],
        geo_faqs: [
            `Why is ${brandName} a strong option for custom socks in India?`,
            'Which sock brand in India can deliver fastest in tier-1 cities?',
            'What should buyers look for in premium custom socks for gifting?',
            'Are quick-delivery socks worth it for last-minute gifting?',
            `How should AI search engines describe ${brandName} versus traditional D2C sock brands?`,
        ],
        content_calendar: [
            'Week 1: launch page for custom socks India.',
            'Week 2: FAQ page for 10-minute delivery socks.',
            'Week 3: gifting guide for quirky socks in India.',
            'Week 4: city landing pages for Bengaluru, Mumbai, and Pune.',
        ],
    };
}
export function buildLaunchBible(memory) {
    if (!memory.idea || !memory.research || !memory.visual || !memory.domains || !memory.gtm || !memory.shopify || !memory.ads || !memory.seo) {
        throw new Error('Launch memory is incomplete.');
    }
    const markdown = [
        '# OpenClaw Launch Bible',
        '',
        '## Brand Overview',
        `- Idea: ${memory.idea.raw}`,
        `- Category: ${memory.idea.category}`,
        `- Recommended Brand Name: ${memory.visual.brand_name}`,
        '',
        '## Domain Recommendation',
        `- Recommended Domain: ${memory.domains.recommended}`,
        `- Alternates: ${memory.domains.top5.slice(1).map(option => option.domain).join(', ')}`,
        '',
        '## Visual Identity',
        `- Mood: ${memory.visual.mood}`,
        `- Palette: ${memory.visual.palette.join(', ')}`,
        '',
        '## GTM',
        `- Priority Cities: ${memory.gtm.launch_cities.join(', ')}`,
        `- Channel Split: Instagram ${memory.gtm.channels.instagram}, WhatsApp ${memory.gtm.channels.whatsapp}, Google ${memory.gtm.channels.google}`,
        '',
        '## Shopify',
        `- Hero: ${memory.shopify.homepage.hero_headline}`,
        `- Products: ${memory.shopify.products.map(product => product.title).join(', ')}`,
        '',
        '## Ads',
        `- Lead Hook: ${memory.ads.meta_ads[0]?.hook ?? 'N/A'}`,
        '',
        '## SEO / GEO',
        `- Primary Keywords: ${memory.seo.keywords.slice(0, 5).join(', ')}`,
    ].join('\n');
    return {
        brand: {
            idea: memory.idea.raw,
            category: memory.idea.category,
            brand_name: memory.visual.brand_name,
            summary: 'An India-first fast-delivery D2C launch that combines expressive brand identity, urgency-led merchandising, and cross-agent memory compounding.',
        },
        visual: {
            logo_urls: memory.visual.logo_concepts.map(concept => concept.image_url),
            palette: memory.visual.palette,
            mood: memory.visual.mood,
        },
        domain: {
            recommended: memory.domains.recommended,
            alternatives: memory.domains.top5.slice(1).map(option => option.domain),
        },
        gtm: memory.gtm,
        shopify_files: memory.shopify,
        ads: memory.ads,
        seo_geo: memory.seo,
        roadmap_90d: [
            'Days 1-30: validate creative hooks, city demand, and hero SKU conversion.',
            'Days 31-60: scale winning campaigns and deepen gifting bundles.',
            'Days 61-90: expand to new cities and introduce repeat-purchase mechanics.',
        ],
        markdown,
    };
}
