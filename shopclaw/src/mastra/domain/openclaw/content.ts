import type {
  AdsMemory,
  Clarification,
  ClarificationAnswer,
  ClarificationPrompt,
  BriefMemory,
  DomainMemory,
  GTMMemory,
  LaunchBible,
  OpenClawMemory,
  ResearchMemory,
  SEOMemory,
  ShopifyMemory,
  VisualMemory,
} from './schemas.js';

type BuilderMemory = Partial<Omit<OpenClawMemory, 'audit_log' | 'idea'>> & {
  audit_log: OpenClawMemory['audit_log'];
  idea:
    | (Omit<NonNullable<OpenClawMemory['idea']>, 'clarification_answers'> & {
        clarification_answers?: string[];
      })
    | null;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function inferCategory(idea: string): string {
  const normalized = idea.toLowerCase();
  if (normalized.includes('deliver') || normalized.includes('10 minutes') || normalized.includes('quick')) {
    return 'quick-commerce fashion';
  }
  if (normalized.includes('beauty') || normalized.includes('skincare')) {
    return 'beauty d2c';
  }
  return 'd2c lifestyle';
}

export function buildClarifications(idea: string): Clarification[] {
  const category = inferCategory(idea);

  return [
    {
      question: 'What cities in India should we prioritise first?',
      assumption:
        category === 'quick-commerce fashion'
          ? 'Assuming Bengaluru, Mumbai, and Pune are the phase-one launch cities.'
          : 'Assuming Bengaluru, Mumbai, and Delhi are the phase-one launch cities.',
    },
    {
      question: 'What price point are we targeting?',
      assumption: 'Assuming an accessible premium launch price band of Rs 399 to Rs 799.',
    },
    {
      question: 'Is this direct-to-consumer only or open to quick-commerce channels?',
      assumption:
        category === 'quick-commerce fashion'
          ? 'Assuming D2C first with quick-commerce partnerships explored in phase two.'
          : 'Assuming D2C first with marketplaces as a later expansion channel.',
    },
  ];
}

function dedupePrompts(prompts: ClarificationPrompt[]): ClarificationPrompt[] {
  const seen = new Set<string>();
  return prompts.filter(prompt => {
    if (seen.has(prompt.id)) {
      return false;
    }
    seen.add(prompt.id);
    return true;
  });
}

export function collectLaunchClarifications(idea: string): ClarificationPrompt[] {
  const category = inferCategory(idea);
  const normalized = idea.toLowerCase();

  const prompts: ClarificationPrompt[] = [
    {
      id: 'launch-cities',
      question: 'Which Indian cities should we prioritise for the first launch wave?',
      rationale: 'City priority affects research framing, GTM sequencing, ads targeting, and SEO.',
      target_sections: ['brief', 'research', 'gtm', 'ads', 'seo'],
      assumption:
        category === 'quick-commerce fashion'
          ? 'Assume Bengaluru, Mumbai, and Pune.'
          : 'Assume Bengaluru, Mumbai, and Delhi.',
    },
    {
      id: 'price-band',
      question: 'What launch price band should we optimize for?',
      rationale: 'Pricing changes positioning, merchandising, GTM hooks, and paid acquisition math.',
      target_sections: ['brief', 'research', 'gtm', 'shopify', 'ads'],
      assumption: 'Assume Rs 399 to Rs 799.',
    },
  ];

  if (normalized.includes('sock') || normalized.includes('fashion') || normalized.includes('brand')) {
    prompts.push({
      id: 'brand-tone',
      question: 'Should the brand feel serious and premium, or fun and quirky? Also include any colors to prefer or avoid and any brand references you admire.',
      rationale: 'Visual direction needs a concrete tone, palette constraint, and stylistic reference.',
      target_sections: ['brief', 'visual', 'shopify', 'ads'],
      assumption: 'Assume playful, energetic, and modern.',
    });
  } else {
    prompts.push({
      id: 'channel-strategy',
      question: 'Should we plan for D2C-only at launch, or include quick-commerce and marketplace channels?',
      rationale: 'Channel strategy changes domain language, GTM sequencing, ads, and SEO landing pages.',
      target_sections: ['brief', 'domains', 'gtm', 'ads', 'seo'],
      assumption: 'Assume D2C-first with quick-commerce explored next.',
    });
  }

  return dedupePrompts(prompts).slice(0, 3);
}

export function normalizeClarificationAnswers(
  prompts: ClarificationPrompt[],
  answers: string[],
): ClarificationAnswer[] {
  return prompts.map((prompt, index) => ({
    question_id: prompt.id,
    question: prompt.question,
    answer: answers[index]?.trim() || prompt.assumption || 'No answer provided.',
    target_sections: prompt.target_sections,
  }));
}

export function buildFounderBrief(answers: ClarificationAnswer[]): BriefMemory {
  return {
    answers,
    founder_brief: answers.map(answer => `${answer.question}: ${answer.answer}`).join('\n'),
  };
}

export function generateBrandCandidates(idea: string): string[] {
  const normalized = idea.toLowerCase();
  if (normalized.includes('sock')) {
    return ['Sockzy', 'Pairly', 'Feetsy', 'DashSock', 'Looplane'];
  }

  const root = titleCase(slugify(idea).split('-').slice(0, 2).join(' ')) || 'LaunchLab';
  const token = root.split(' ')[0] || 'Launch';
  return [
    root.replace(/\s+/g, ''),
    `${token}ly`,
    `${token}Co`,
    `${token}Hive`,
    `${token}Lane`,
  ];
}

export function buildResearch(idea: string, memory: BuilderMemory): ResearchMemory {
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
    whitespace:
      'Own the intersection of expressive design, instant gratification, and gifting convenience for tier-1 urban buyers.',
    keywords: {
      primary: [baseKeyword, '10 minute delivery socks', 'premium socks india'],
      secondary: ['gift socks online', 'same day socks', 'quirky socks india', memory.idea?.category ?? 'd2c fashion'],
    },
    india_insight:
      'Fast-delivery expectations are now normalized by grocery apps, creating room for a specialized brand that turns urgency into novelty and repeat gifting.',
  };
}

export function buildDomainOptions(memory: BuilderMemory): DomainMemory {
  const candidates = memory.idea?.brand_name_candidates ?? ['Sockzy', 'Pairly', 'Feetsy', 'DashSock', 'Looplane'];
  const paddedCandidates = [...candidates];
  while (paddedCandidates.length < 5) {
    paddedCandidates.push(`Brand${paddedCandidates.length + 1}`);
  }
  const ranked = paddedCandidates.slice(0, 5).map((name, index) => {
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

  const recommended = ranked.find(item => item.available)?.domain ?? ranked[0]!.domain;

  return {
    recommended,
    top5: ranked,
  };
}

export function buildVisualDirection(memory: BuilderMemory): VisualMemory {
  const brandName = memory.idea?.brand_name_candidates?.[0] ?? 'Sockzy';
  const toneAnswer = memory.brief?.answers.find(answer => answer.question_id === 'brand-tone')?.answer.toLowerCase() ?? '';
  const whitespace = memory.research?.whitespace ?? 'Own a fast, expressive niche.';
  const marketInsight = memory.research?.india_insight ?? whitespace;
  const recommendedDomain = memory.domains?.recommended ?? `${slugify(brandName)}.in`;
  const mood = toneAnswer.includes('premium') ? 'premium' : toneAnswer.includes('bold') ? 'bold' : 'playful';
  const palette = toneAnswer.includes('pastel')
    ? ['#F4B6C2', '#B8E1FF', '#FFF1B5', '#6B7FD7']
    : toneAnswer.includes('premium')
      ? ['#102A43', '#CBA135', '#F0F4F8', '#7A9E9F']
      : ['#FF6A3D', '#102A43', '#F0F4F8', '#17B890'];

  return {
    brand_name: brandName,
    logo_concepts: [
      {
        name: `${brandName} Sprint`,
        mood: 'bold',
        prompt: `Design a bold wordmark for ${brandName}. Use the whitespace "${whitespace}", align it to ${recommendedDomain}, and reflect this founder direction: ${toneAnswer || 'playful, energetic, and modern'}.`,
        image_url: `https://assets.openclaw.local/${slugify(brandName)}-concept-1.png`,
      },
      {
        name: `${brandName} Grid`,
        mood: 'premium',
        prompt: `Create a geometric icon plus sans-serif lockup for ${brandName}. Incorporate the market insight "${marketInsight}" and make it feel ${mood}.`,
        image_url: `https://assets.openclaw.local/${slugify(brandName)}-concept-2.png`,
      },
      {
        name: `${brandName} Mascot`,
        mood: 'playful',
        prompt: `Create an illustrated mascot-led logo for ${brandName}. Use palette ${palette.join(', ')}, tie it to ${recommendedDomain}, and reflect this founder guidance: ${toneAnswer || 'playful brand with broad youth appeal'}.`,
        image_url: `https://assets.openclaw.local/${slugify(brandName)}-concept-3.png`,
      },
    ],
    chosen_concept: 0,
    palette,
    font_pairing: 'Space Grotesk + Instrument Sans',
    mood,
  };
}

export function buildGTM(memory: BuilderMemory): GTMMemory {
  const brandName = memory.visual?.brand_name ?? memory.idea?.brand_name_candidates?.[0] ?? 'Sockzy';
  const citiesAnswer = memory.brief?.answers.find(answer => answer.question_id === 'launch-cities')?.answer;
  const parsedCities = citiesAnswer
    ? citiesAnswer.split(/[,\n]/).map(city => city.trim()).filter(Boolean)
    : ['Bengaluru', 'Mumbai', 'Pune', 'Hyderabad'];
  const pricingAnswer = memory.brief?.answers.find(answer => answer.question_id === 'price-band')?.answer ?? 'Rs 399 to Rs 799';

  return {
    launch_cities: parsedCities.slice(0, 4),
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
    influencer_brief: `Prioritise nano and micro creators in ${parsedCities.slice(0, 2).join(' and ')}. Anchor the launch story around ${pricingAnswer}, urgency-led hooks, and India-first lifestyle moments for ${brandName}.`,
    week1_checklist: [
      'Lock hero SKU assortment and launch pricing.',
      'Seed 20 creators with gifting kits and a same-day delivery challenge.',
      'Set up WhatsApp opt-in flow for launch drops.',
      'Launch 10 urgency-led reels and 3 founder-story posts.',
      'Track CAC, repeat intent, and top city conversion by day.',
    ],
  };
}

export function buildShopify(memory: BuilderMemory): ShopifyMemory {
  const palette = memory.visual?.palette ?? ['#FF6A3D', '#102A43', '#F0F4F8'];
  const keywords = memory.research?.keywords.primary ?? ['custom socks india'];
  const brandName = memory.visual?.brand_name ?? 'Sockzy';

  const files = [
    {
      path: '/shopify/theme-settings.json',
      content: JSON.stringify(
        {
          theme: 'Dawn',
          palette,
          fonts: {
            heading: memory.visual?.font_pairing.split(' + ')[0] ?? 'Space Grotesk',
            body: memory.visual?.font_pairing.split(' + ')[1] ?? 'Instrument Sans',
          },
        },
        null,
        2,
      ),
      kind: 'json' as const,
    },
    {
      path: '/shopify/products.json',
      content: JSON.stringify(
        [
          { title: `${brandName} Classic Rush`, price_inr: 399 },
          { title: `${brandName} Print Sprint`, price_inr: 549 },
          { title: `${brandName} Premium Pair`, price_inr: 799 },
        ],
        null,
        2,
      ),
      kind: 'json' as const,
    },
    {
      path: '/shopify/homepage-sections.json',
      content: JSON.stringify(
        {
          hero_headline: `${brandName} delivers expressive socks at quick-commerce speed.`,
          hero_subheadline: 'A launch-ready storefront tuned for impulse gifting, city-first delivery, and premium everyday style.',
        },
        null,
        2,
      ),
      kind: 'json' as const,
    },
    {
      path: '/shopify/collections.json',
      content: JSON.stringify(
        [
          { name: 'Everyday Essentials', handle: 'everyday-essentials' },
          { name: 'Giftable Drops', handle: 'giftable-drops' },
          { name: 'Premium Sets', handle: 'premium-sets' },
        ],
        null,
        2,
      ),
      kind: 'json' as const,
    },
  ];

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
    files,
    package_summary: `Patch-ready Shopify starter package for ${brandName} with ${files.length} generated files.`,
  };
}

export function buildAds(memory: BuilderMemory): AdsMemory {
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

export function buildSEO(memory: BuilderMemory): SEOMemory {
  const brandName = memory.visual?.brand_name ?? 'Sockzy';
  const primary = memory.research?.keywords.primary ?? ['custom socks india', '10 minute delivery socks'];
  const baseCities =
    memory.gtm?.launch_cities && memory.gtm.launch_cities.length > 0
      ? memory.gtm.launch_cities
      : ['Bengaluru', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad'];
  const cities = [...baseCities];
  while (cities.length < 5) {
    cities.push(`City ${cities.length + 1}`);
  }
  const geoQualifier =
    memory.brief?.answers.find(answer => answer.question_id === 'seo-language')?.answer.toLowerCase().includes('hindi')
      ? 'Hindi + English'
      : 'English-first';

  return {
    keywords: [...primary, 'best socks brand india 2026', `${slugify(brandName)} socks`, 'gift socks india'],
    geo_faqs: cities.slice(0, 5).map(city => `Where can I buy ${brandName} in ${city}?`),
    content_calendar: [
      'Week 1: launch page for custom socks India.',
      'Week 2: FAQ page for 10-minute delivery socks.',
      'Week 3: gifting guide for quirky socks in India.',
      `Week 4: ${geoQualifier} city landing pages for ${cities.slice(0, 3).join(', ')}.`,
    ],
    geo_pages: cities.slice(0, 5).map((city, index) => ({
      title: `${brandName} in ${city}: answer-ready buying guide`,
      slug: `${slugify(brandName)}-${slugify(city)}-buying-guide`,
      target_query: `${brandName} ${city} ${primary[index % primary.length] ?? primary[0]!}`,
      body: `${brandName} is positioned for ${city} shoppers looking for ${primary[index % primary.length] ?? primary[0]!}. This page combines classic SEO structure with answer-ready GEO formatting so AI systems can cite city-specific recommendations, delivery expectations, and product fit.`,
      citation_notes: [
        `Ground ${city}-specific claims with launch operations data before publishing.`,
        'Keep paragraphs short, answer-first, and citation-ready for AI search.',
      ],
    })),
  };
}

export function buildLaunchBible(memory: BuilderMemory): LaunchBible {
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
      summary:
        'An India-first fast-delivery D2C launch that combines expressive brand identity, urgency-led merchandising, and cross-agent memory compounding.',
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
    artifacts: [
      { path: '/shopify/theme-settings.json', description: 'Theme settings derived from visual memory.' },
      { path: '/shopify/products.json', description: 'Initial catalog payload for launch SKUs.' },
      { path: '/shopify/homepage-sections.json', description: 'Homepage hero and value-prop sections.' },
      { path: '/seo/geo-pages.json', description: 'AI-citation-ready GEO page pack.' },
    ],
    markdown,
  };
}
