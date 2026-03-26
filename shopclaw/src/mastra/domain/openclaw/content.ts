import type {
  AdsMemory,
  Clarification,
  ClarificationAnswer,
  ClarificationPrompt,
  BriefMemory,
  DomainMemory,
  GTMMemory,
  LaunchBible,
  LaunchBibleGeneration,
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

const IDEA_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'brand',
  'build',
  'create',
  'for',
  'i',
  'in',
  'is',
  'launch',
  'my',
  'of',
  'start',
  'startup',
  'the',
  'to',
  'want',
]);

function extractMeaningfulIdeaTokens(idea: string): string[] {
  return slugify(idea)
    .split('-')
    .map(token => token.trim())
    .filter(token => token.length > 2 && !IDEA_STOP_WORDS.has(token));
}

function fallbackBrandCandidates(category: string): string[] {
  if (category === 'restaurant') {
    return ['Saffron Table', 'Tiffin Lane', 'Spice Quarter', 'Gather Spoon', 'City Supper'];
  }

  if (category === 'beauty d2c') {
    return ['Glow Theory', 'Skin Circuit', 'Luma Ritual', 'Pure Edit', 'Mirror Bloom'];
  }

  if (category === 'quick-commerce fashion') {
    return ['Dash Thread', 'Minute Mode', 'Rush Rack', 'Blink Fit', 'Swift Stitch'];
  }

  return ['Launch Lane', 'North Star', 'Signal House', 'Maker Grid', 'Foundry Co'];
}

export function inferCategory(idea: string): string {
  const normalized = idea.toLowerCase();
  if (normalized.includes('restaurant') || normalized.includes('cafe') || normalized.includes('dining') || normalized.includes('food')) {
    return 'restaurant';
  }
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
      question: 'Who is the first core customer segment we should optimize for?',
      assumption:
        category === 'restaurant'
          ? 'Assuming urban millennials, Gen Z professionals, and weekend family diners.'
          : 'Assuming urban Gen Z and millennial shoppers who care about convenience and brand distinctiveness.',
    },
    {
      question: 'What tone and visual direction should we lean into, including any colors to prefer or avoid?',
      assumption:
        category === 'restaurant'
          ? 'Assuming warm, modern, and inviting with earthy reds, spice tones, and no neon palette.'
          : 'Assuming playful, energetic, and modern with bold warm colors and no muted corporate palette.',
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
    {
      id: 'customer-segment',
      question: 'Who is the first core customer segment we should optimize for?',
      rationale: 'Research framing, GTM hooks, merchandising, and SEO all depend on a clear first audience.',
      target_sections: ['brief', 'research', 'gtm', 'shopify', 'ads', 'seo'],
      assumption:
        category === 'restaurant'
          ? 'Assume urban millennials, Gen Z professionals, and weekend family diners.'
          : 'Assume urban Gen Z and millennial buyers who care about convenience and distinct design.',
    },
    {
      id: 'brand-tone',
      question: 'What tone and visual direction should we lean into, including any colors to prefer or avoid?',
      rationale: 'Visual direction needs explicit tone and palette constraints before logo, Shopify, and ad creative work starts.',
      target_sections: ['brief', 'visual', 'shopify', 'ads'],
      assumption:
        category === 'restaurant'
          ? 'Assume warm, modern, and inviting with earthy reds and spice tones, and avoid neon colors.'
          : 'Assume playful, energetic, and modern with bold warm colors, and avoid muted corporate tones.',
    },
    {
      id: 'channel-strategy',
      question: 'Should we plan for D2C-only at launch, or include quick-commerce and marketplace channels?',
      rationale: 'Channel strategy changes domain language, GTM sequencing, ads, and SEO landing pages.',
      target_sections: ['brief', 'domains', 'gtm', 'ads', 'seo'],
      assumption:
        category === 'quick-commerce fashion'
          ? 'Assume D2C-first with quick-commerce explored immediately after launch.'
          : 'Assume D2C-first with quick-commerce and marketplaces explored next.',
    },
  ];

  return dedupePrompts(prompts).slice(0, 5);
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

  const category = inferCategory(idea);
  const meaningfulTokens = extractMeaningfulIdeaTokens(idea);

  if (meaningfulTokens.length === 0) {
    return fallbackBrandCandidates(category);
  }

  const root = titleCase(meaningfulTokens.slice(0, 2).join(' ')) || 'Launch Lab';
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
  const category = memory.idea?.category ?? inferCategory(idea);
  const baseKeyword = idea.toLowerCase().includes('sock') ? 'custom socks india' : `${slugify(idea)} india`;

  if (category === 'restaurant') {
    return {
      competitors: [
        {
          name: 'Barbeque Nation',
          region: 'India',
          positioning: 'experience-led casual dining chain',
          notes: 'Strong group dining proposition and broad urban recall.',
        },
        {
          name: 'Social',
          region: 'India',
          positioning: 'urban dining and community-first hospitality brand',
          notes: 'Wins with atmosphere, all-day occasions, and strong city-specific relevance.',
        },
        {
          name: 'Rebel Foods',
          region: 'India',
          positioning: 'cloud-kitchen and digital-first food brand operator',
          notes: 'Sets consumer expectations on convenience, delivery discovery, and menu experimentation.',
        },
      ],
      market_size_inr:
        'India foodservice is a multi-lakh-crore market, with organized casual dining and branded restaurant concepts growing on rising urban disposable income and delivery-enabled demand.',
      whitespace:
        'Own the gap between approachable everyday dining and a warm, design-forward full-service restaurant experience for urban Indian diners.',
      keywords: {
        primary: [baseKeyword, 'restaurant market india', 'casual dining india'],
        secondary: ['best restaurants india', 'full service restaurant india', 'restaurant launch india', category],
      },
      india_insight:
        'Indian restaurant brands that combine recognizable regional flavors, consistent in-store experience, and digital ordering convenience can scale faster in metro markets than generic dining concepts.',
    };
  }

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
  const baseCandidates = memory.idea?.brand_name_candidates ?? ['Sockzy', 'Pairly', 'Feetsy', 'DashSock', 'Looplane'];
  const expandedCandidates: string[] = [];
  const suffixes = ['Now', 'Go', 'Rush', 'Lane', 'Lab', 'HQ', 'Drop', 'Dash', 'Club', 'Hub'];

  for (const candidate of baseCandidates) {
    if (!expandedCandidates.includes(candidate)) {
      expandedCandidates.push(candidate);
    }
  }

  for (const candidate of baseCandidates) {
    for (const suffix of suffixes) {
      if (expandedCandidates.length >= 15) {
        break;
      }

      const expanded = `${candidate}${suffix}`;
      if (!expandedCandidates.includes(expanded)) {
        expandedCandidates.push(expanded);
      }
    }

    if (expandedCandidates.length >= 15) {
      break;
    }
  }

  while (expandedCandidates.length < 15) {
    expandedCandidates.push(`Brand${expandedCandidates.length + 1}`);
  }

  const ranked = expandedCandidates.slice(0, 15).map((name, index) => {
    const domain = `${slugify(name)}.in`;
    const available = index % 6 !== 3;
    const score = Math.max(40, 95 - index * 3);

    return {
      name,
      domain,
      available,
      price_inr: 699 + index * 50,
      score,
      reasoning: available
        ? `${name} is short, brandable, and strong for India-first recall.`
        : `${name} is memorable but likely conflicted, so it is better used as a fallback.`,
    };
  });

  const recommended = ranked.find(item => item.available)?.domain ?? ranked[0]!.domain;

  return {
    recommended,
    top5: ranked.slice(0, 5),
    candidates15: ranked,
  };
}

export function normalizeDomainMemory(input: DomainMemory): DomainMemory {
  const seenDomains = new Set<string>();
  const normalizedCandidates = input.candidates15
    .map(candidate => ({
      ...candidate,
      domain: candidate.domain.toLowerCase(),
      price_inr: Math.max(0, Math.trunc(candidate.price_inr)),
      score: Math.max(0, Math.min(100, candidate.score)),
    }))
    .filter(candidate => {
      if (!candidate.domain || seenDomains.has(candidate.domain)) {
        return false;
      }
      seenDomains.add(candidate.domain);
      return true;
    });

  const fillSource = [...normalizedCandidates, ...input.top5];
  while (normalizedCandidates.length < 15) {
    const index = normalizedCandidates.length;
    const fallback = fillSource[index % Math.max(fillSource.length, 1)] ?? {
      name: `Brand${index + 1}`,
      domain: `brand${index + 1}.in`,
      available: index % 4 !== 0,
      price_inr: index % 4 !== 0 ? 699 + index * 50 : 0,
      score: Math.max(40, 90 - index * 3),
      reasoning: 'Generated fallback shortlist entry to complete the candidate set.',
    };

    normalizedCandidates.push({
      ...fallback,
      name: `${fallback.name}${index >= fillSource.length ? ` ${index + 1}` : ''}`.trim(),
      domain:
        index >= fillSource.length
          ? `${slugify(fallback.name)}-${index + 1}.in`
          : fallback.domain.toLowerCase(),
      price_inr: Math.max(0, Math.trunc(fallback.price_inr)),
      score: Math.max(0, Math.min(100, fallback.score)),
    });
  }

  const candidatePool = [
    ...input.top5.map(candidate => ({
      ...candidate,
      domain: candidate.domain.toLowerCase(),
      price_inr: Math.max(0, Math.trunc(candidate.price_inr)),
      score: Math.max(0, Math.min(100, candidate.score)),
    })),
    ...normalizedCandidates,
  ];

  const recommendedCandidate =
    candidatePool.find(candidate => candidate.domain === input.recommended.toLowerCase()) ??
    candidatePool.find(candidate => candidate.name.toLowerCase() === input.recommended.toLowerCase()) ??
    normalizedCandidates.find(candidate => candidate.available) ??
    normalizedCandidates[0];

  const topFiveDomains = new Set<string>();
  const normalizedTop5 = [...input.top5, ...normalizedCandidates]
    .map(candidate => ({
      ...candidate,
      domain: candidate.domain.toLowerCase(),
      price_inr: Math.max(0, Math.trunc(candidate.price_inr)),
      score: Math.max(0, Math.min(100, candidate.score)),
    }))
    .filter(candidate => {
      if (topFiveDomains.has(candidate.domain)) {
        return false;
      }
      topFiveDomains.add(candidate.domain);
      return true;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  return {
    recommended: recommendedCandidate?.domain ?? normalizedTop5[0]?.domain ?? 'launchbrand.in',
    top5: normalizedTop5,
    candidates15: normalizedCandidates.slice(0, 15),
  };
}

export function buildVisualDirection(memory: BuilderMemory): VisualMemory {
  const brandName = memory.domains?.top5[0]?.name ?? memory.idea?.brand_name_candidates?.[0] ?? 'Sockzy';
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
  const category = memory.idea?.category ?? inferCategory(memory.idea?.raw ?? '');
  const brandName =
    memory.visual?.brand_name ?? memory.domains?.top5[0]?.name ?? memory.idea?.brand_name_candidates?.[0] ?? 'Sockzy';
  const parsedCities = extractFounderCities(memory);
  const pricingAnswer = memory.brief?.answers.find(answer => answer.question_id === 'price-band')?.answer ?? 'Rs 399 to Rs 799';

  if (category === 'restaurant') {
    return {
      launch_cities: parsedCities.slice(0, 4),
      channels: {
        instagram: '40%',
        whatsapp: '25%',
        google: '35%',
      },
      reel_ideas: [
        `Signature plating moments from ${brandName} in ${parsedCities[0] ?? 'your first launch city'}.`,
        'Behind-the-pass kitchen shots that build trust and appetite.',
        'Founding story: why this restaurant concept belongs in this city right now.',
        'Chef-led menu walkthrough of hero dishes and regional influences.',
        'Family and group dining moments that show ambience and hospitality.',
        'Day-to-night transition reel showing the full in-store mood.',
        'Weekend special spotlight with limited-menu urgency.',
        'Local sourcing and ingredient freshness stories.',
        'Customer reactions to the hero thali, curry, and breakfast items.',
        `${brandName} table-to-camera tasting flight challenge.`,
      ],
      influencer_brief: `Prioritise food creators and hyperlocal city storytellers in ${parsedCities.slice(0, 3).join(', ')}. Anchor the launch story around ${pricingAnswer}, approachable dine-in value, warm hospitality, and memorable regional flavor for ${brandName}.`,
      week1_checklist: [
        'Lock launch menu, hero dishes, and reservation flow.',
        'Set up Google Business Profile, maps listings, and launch-city review capture.',
        'Invite 15 to 20 food creators for preview tastings and short-form content.',
        'Publish opening-week reels, stories, and founder notes across Instagram and WhatsApp.',
        'Track walk-ins, reservations, repeat diners, and city-level conversion by day.',
      ],
    };
  }

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

export function extractFounderCities(memory: BuilderMemory): string[] {
  const citiesAnswer = memory.brief?.answers.find(answer => answer.question_id === 'launch-cities')?.answer;
  const parsedCities = citiesAnswer
    ? citiesAnswer
        .split(/[,\n]/)
        .map(city => city.trim())
        .filter(Boolean)
    : [];

  if (parsedCities.length === 0) {
    return ['Bengaluru', 'Mumbai', 'Pune'];
  }

  return parsedCities;
}

export function normalizeGTM(memory: BuilderMemory, input: Partial<GTMMemory>): GTMMemory {
  const fallback = buildGTM(memory);
  const founderCities = extractFounderCities(memory);
  const normalizedCities =
    founderCities.length > 0
      ? founderCities
      : (input.launch_cities ?? fallback.launch_cities).filter(
          (city, index, cities) => Boolean(city) && cities.indexOf(city) === index,
        );

  return {
    ...fallback,
    ...input,
    launch_cities: normalizedCities,
    channels: {
      ...fallback.channels,
      ...(input.channels ?? {}),
    },
    reel_ideas:
      input.reel_ideas && input.reel_ideas.length >= 10
        ? input.reel_ideas.slice(0, 10)
        : fallback.reel_ideas,
    influencer_brief: (input.influencer_brief ?? fallback.influencer_brief).replace(/\s+/g, ' ').trim(),
    week1_checklist:
      input.week1_checklist && input.week1_checklist.length >= 5
        ? input.week1_checklist
        : fallback.week1_checklist,
  };
}

export function buildShopify(memory: BuilderMemory): ShopifyMemory {
  const palette = memory.visual?.palette ?? ['#D35400', '#E67E22', '#F4A460', '#FFF5E1', '#6E2C00'];
  const keywords = memory.research?.keywords.primary ?? ['indian restaurant'];
  const brandName = memory.visual?.brand_name ?? 'Restaurantly';
  const city = memory.gtm?.launch_cities?.[0] ?? 'Chennai';
  const [headingFont, bodyFont] = (memory.visual?.font_pairing ?? 'Montserrat + Lora')
    .split(' + ')
    .map(part => part.trim());

  const products = [
    {
      title: `${brandName} Signature Thali`,
      price_inr: 450,
      description: `A complete thali built around ${keywords[0]} with regional mains, breads, rice, and a strong dine-in sharing experience.`,
      tags: ['signature', city.toLowerCase(), ...keywords.slice(0, 2)],
    },
    {
      title: `${brandName} Butter Chicken Feast`,
      price_inr: 400,
      description: `A rich North Indian comfort dish designed for customers searching for ${keywords[1] ?? keywords[0]} and dependable everyday indulgence.`,
      tags: ['north-indian', 'comfort-food', ...keywords.slice(0, 2)],
    },
    {
      title: `${brandName} South Indian Breakfast`,
      price_inr: 350,
      description: `A lighter breakfast platter positioned for discovery around ${keywords[2] ?? keywords[0]} with familiar staples and approachable pricing.`,
      tags: ['south-indian', 'breakfast', ...keywords.slice(0, 2)],
    },
  ];

  const collections = [
    {
      name: 'Signature Meals',
      handle: 'signature-meals',
      description: 'High-intent meal bundles that establish the hero dishes for launch.',
    },
    {
      name: 'Regional Comforts',
      handle: 'regional-comforts',
      description: 'Familiar dishes with localized flavors and repeat-order potential.',
    },
    {
      name: 'Breakfast & Light Bites',
      handle: 'breakfast-light-bites',
      description: 'Morning and snack-time dishes to widen ordering occasions.',
    },
  ];

  const themeSettings = {
    theme: 'Dawn',
    palette,
    fonts: {
      heading: headingFont || 'Montserrat',
      body: bodyFont || 'Lora',
    },
    hero_cta: 'Order the launch menu',
  };

  const homepage = {
    hero_headline: `${brandName} brings warm, regional Indian meals to ${city}.`,
    hero_subheadline: 'A launch-ready storefront built around signature dishes, approachable pricing, and a modern dine-in-first brand voice.',
    value_props: ['Regional flavor-led menu', 'Warm hospitality brand system', 'City-first launch merchandising'],
  };

  const templates = {
    config_settings_data: {
      current: {
        theme_name: 'Dawn',
        theme_version: '15.0.0',
        settings: {
          color_button: palette[0] ?? '#D35400',
          color_button_text: '#ffffff',
          color_background: palette[3] ?? '#FFF5E1',
          color_text: palette[4] ?? '#6E2C00',
          color_accent_1: palette[1] ?? '#E67E22',
          color_accent_2: palette[2] ?? '#F4A460',
          type_header_font: headingFont || 'Montserrat',
          type_body_font: bodyFont || 'Lora',
          social_instagram_link: `https://instagram.com/${slugify(brandName)}`,
        },
      },
      presets: {},
    },
    templates_index: {
      sections: {
        image_banner: {
          type: 'image-banner',
          settings: {
            heading: homepage.hero_headline,
            text: homepage.hero_subheadline,
            button_label_1: themeSettings.hero_cta,
            button_link_1: '/collections/signature-meals',
            color_scheme: 'scheme-1',
            image_overlay_opacity: 20,
          },
        },
        rich_text: {
          type: 'rich-text',
          settings: {
            heading: `${brandName} launch menu`,
            text: homepage.value_props.join(' • '),
            button_label: 'Explore collections',
            button_link: '/collections/all',
            color_scheme: 'scheme-2',
          },
        },
        featured_collection: {
          type: 'featured-collection',
          settings: {
            title: collections[0].name,
            heading_size: 'h2',
            description: collections[0].description,
            products_to_show: 3,
            collection: collections[0].handle,
            show_view_all: true,
          },
        },
      },
      order: ['image_banner', 'rich_text', 'featured_collection'],
    },
    locales_en_default: {
      'general.search.placeholder': `Search ${brandName} dishes`,
      'sections.header.menu': 'Menu',
      'sections.cart.title': 'Your order',
      'products.product.add_to_cart': 'Add to order',
      'products.product.sold_out': 'Unavailable today',
      'sections.footer.newsletter': `Get ${brandName} menu drops first`,
    },
    readme_markdown: [
      `# ${brandName} Shopify Launch Package`,
      '',
      `This package contains Dawn-compatible starter files for ${brandName}.`,
      '',
      '## Included files',
      '- `config/settings_data.json` with launch palette, font, and CTA settings',
      '- `templates/index.json` with homepage section order and section settings',
      '- `locales/en.default.json` with storefront copy',
      '- `products.json` with starter launch catalog',
      '',
      '## Merchandising notes',
      `- Primary launch city: ${city}`,
      `- Hero CTA: ${themeSettings.hero_cta}`,
      `- Collections: ${collections.map(collection => collection.name).join(', ')}`,
    ].join('\n'),
  };

  const files = [
    {
      path: 'config/settings_data.json',
      content: JSON.stringify(templates.config_settings_data, null, 2),
      kind: 'json' as const,
    },
    {
      path: 'templates/index.json',
      content: JSON.stringify(templates.templates_index, null, 2),
      kind: 'json' as const,
    },
    {
      path: 'locales/en.default.json',
      content: JSON.stringify(templates.locales_en_default, null, 2),
      kind: 'json' as const,
    },
    {
      path: 'README.md',
      content: templates.readme_markdown,
      kind: 'markdown' as const,
    },
    {
      path: 'products.json',
      content: JSON.stringify(products, null, 2),
      kind: 'json' as const,
    },
  ];

  return {
    theme_settings: themeSettings,
    products,
    homepage,
    collections,
    templates,
    files,
    package_summary: `Patch-ready Shopify starter package for ${brandName} with ${files.length} generated files.`,
  };
}

export function buildAds(memory: BuilderMemory): AdsMemory {
  const category = memory.idea?.category ?? inferCategory(memory.idea?.raw ?? '');
  const brandName = memory.visual?.brand_name ?? 'Sockzy';

  if (category === 'restaurant') {
    const cityString = memory.gtm?.launch_cities.join(', ') ?? 'Bengaluru, Mumbai, and Delhi';
    return {
      meta_ads: [
        {
          format: 'Reel',
          hook: 'Warm Indian comfort food, built for repeat city dining.',
          body: `${brandName} pairs a strong in-store mood with recognizable regional dishes and approachable pricing across ${cityString}.`,
          cta: 'Reserve your table',
          audience: 'Urban millennials, Gen Z professionals, and family diners in launch cities',
          budget_day_inr: 1200,
        },
        {
          format: 'Carousel',
          hook: 'The launch menu your group chat will keep rebooking.',
          body: `Show the hero thali, signature curry, and breakfast or snack occasions that make ${brandName} a repeat visit brand.`,
          cta: 'See the menu',
          audience: 'Food-led social groups, office-goers, and weekend family diners',
          budget_day_inr: 1500,
        },
        {
          format: 'Story',
          hook: 'Tonight’s dinner plan is solved.',
          body: `${brandName} blends regional flavor, warm hospitality, and a design-forward dining space for city-first restaurant discovery.`,
          cta: 'Book now',
          audience: 'People within delivery and dine-in catchments around launch locations',
          budget_day_inr: 1000,
        },
      ],
      google_campaigns: [
        {
          name: 'Restaurant Brand Intent',
          budget_day_inr: 900,
          ad_groups: [
            {
              name: 'Brand And Menu',
              keywords: [`${slugify(brandName)} restaurant`, `${slugify(brandName)} menu`, `${slugify(brandName)} reservations`],
              match_type: 'phrase',
            },
            {
              name: 'City Dining Intent',
              keywords: ['best restaurant near me', 'casual dining restaurant', 'family dining restaurant'],
              match_type: 'exact',
            },
          ],
        },
        {
          name: 'Cuisine Discovery',
          budget_day_inr: 750,
          ad_groups: [
            {
              name: 'Indian Dining',
              keywords: ['indian restaurant', 'regional indian food', 'best indian dinner'],
              match_type: 'phrase',
            },
            {
              name: 'Occasion Dining',
              keywords: ['weekend dinner restaurant', 'group dining restaurant', 'restaurant reservations'],
              match_type: 'broad',
            },
          ],
        },
      ],
      pacing_plan: {
        start_budget_day_inr: 1200,
        scale_trigger: 'Increase budget once reservation-led CAC and repeat booking rate hold for one full operating week.',
        milestones: [
          'Days 1-7: validate the strongest hook, top city audience, and reservation conversion rate.',
          'Days 8-15: move spend toward best-performing menu angle and highest-intent search clusters.',
          'Days 16-30: scale retargeting, occasion-based creatives, and creator-backed social proof.',
        ],
      },
    };
  }

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
  const category = memory.idea?.category ?? inferCategory(memory.idea?.raw ?? '');
  const brandName = memory.visual?.brand_name ?? 'Sockzy';
  const brandKeyword =
    slugify(brandName) === 'restaurant' ? `${slugify(brandName)} india` : `${slugify(brandName)} ${category === 'restaurant' ? 'restaurant' : 'socks'}`;
  const primary =
    memory.research?.keywords.primary ??
    (category === 'restaurant' ? ['restaurant market india', 'casual dining india'] : ['custom socks india', '10 minute delivery socks']);
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

  if (category === 'restaurant') {
    return {
      keywords: [...primary, 'best restaurant in india', brandKeyword, 'family dining restaurant'],
      geo_faqs: cities.slice(0, 5).map(city => `Where should I dine at ${brandName} in ${city}?`),
      content_calendar: [
        'Week 1: launch page for the flagship restaurant concept and menu.',
        'Week 2: FAQ page for reservations, timings, and dine-in expectations.',
        'Week 3: city food guide covering signature dishes and dining occasions.',
        `Week 4: ${geoQualifier} landing pages for ${cities.slice(0, 3).join(', ')} with maps-ready local discovery copy.`,
      ],
      geo_pages: cities.slice(0, 5).map((city, index) => ({
        title: `${brandName} in ${city}: answer-ready dining guide`,
        slug: `${slugify(brandName)}-${slugify(city)}-dining-guide`,
        target_query: `${brandName} ${city} ${primary[index % primary.length] ?? primary[0]!}`,
        body: `${brandName} is positioned for ${city} diners looking for ${primary[index % primary.length] ?? primary[0]!}. This page is structured for local restaurant discovery, AI-ready answers, and clear dining occasions such as family meals, casual dinners, and reservation-led visits.`,
        citation_notes: [
          `Ground ${city}-specific claims with operating hours, address, and reservation details before publishing.`,
          'Keep answers concise, menu-aware, and easy for AI and local search engines to cite.',
        ],
      })),
    };
  }

  return {
    keywords: [...primary, 'best socks brand india 2026', brandKeyword, 'gift socks india'],
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

  const category = memory.idea.category;
  const markdown = [
    '# OpenClaw Launch Bible',
    '',
    '## Brand Overview',
    `- Idea: ${memory.idea.raw}`,
    `- Category: ${memory.idea.category}`,
    `- Recommended Brand Name: ${memory.visual.brand_name}`,
    `- Founder Brief: ${memory.brief?.founder_brief ?? 'Founder brief not captured.'}`,
    '',
    '## Domain Recommendation',
    `- Recommended Domain: ${memory.domains.recommended}`,
    `- Alternates: ${memory.domains.top5.slice(1).map(option => option.domain).join(', ')}`,
    `- Why This Domain: ${memory.domains.top5[0]?.reasoning ?? 'Strongest available brand-domain fit from the shortlist.'}`,
    '',
    '## Visual Identity',
    `- Mood: ${memory.visual.mood}`,
    `- Palette: ${memory.visual.palette.join(', ')}`,
    `- Font Pairing: ${memory.visual.font_pairing}`,
    `- Concepts: ${memory.visual.logo_concepts.map(concept => `${concept.name} (${concept.mood})`).join(', ')}`,
    '',
    '## GTM',
    `- Priority Cities: ${memory.gtm.launch_cities.join(', ')}`,
    `- Channel Split: Instagram ${memory.gtm.channels.instagram}, WhatsApp ${memory.gtm.channels.whatsapp}, Google ${memory.gtm.channels.google}`,
    `- Reel Ideas: ${memory.gtm.reel_ideas.slice(0, 5).join(' | ')}`,
    `- Influencer Brief: ${memory.gtm.influencer_brief}`,
    `- Week 1 Checklist: ${memory.gtm.week1_checklist.join(' | ')}`,
    '',
    '## Shopify',
    `- Hero: ${memory.shopify.homepage.hero_headline}`,
    `- Hero Subheadline: ${memory.shopify.homepage.hero_subheadline}`,
    `- Products: ${memory.shopify.products.map(product => product.title).join(', ')}`,
    `- Collections: ${memory.shopify.collections.map(collection => collection.name).join(', ')}`,
    `- Theme CTA: ${memory.shopify.theme_settings.hero_cta}`,
    '',
    '## Ads',
    `- Lead Hook: ${memory.ads.meta_ads[0]?.hook ?? 'N/A'}`,
    `- Meta Hooks: ${memory.ads.meta_ads.map(ad => ad.hook).join(' | ')}`,
    `- Google Campaigns: ${memory.ads.google_campaigns.map(campaign => `${campaign.name} (Rs ${campaign.budget_day_inr}/day)`).join(', ')}`,
    `- Pacing Milestones: ${memory.ads.pacing_plan.milestones.join(' | ')}`,
    '',
    '## SEO / GEO',
    `- Primary Keywords: ${memory.seo.keywords.slice(0, 5).join(', ')}`,
    `- GEO FAQs: ${memory.seo.geo_faqs.join(' | ')}`,
    `- Content Calendar: ${memory.seo.content_calendar.join(' | ')}`,
    `- GEO Pages: ${memory.seo.geo_pages.map(page => `${page.title} -> ${page.target_query}`).join(' | ')}`,
    '',
    '## 90-Day Roadmap',
    ...(category === 'restaurant'
      ? [
          '1. Days 1-30: validate launch-city demand, reservation flow, and hero dish mix.',
          '2. Days 31-60: sharpen repeat dining loops, creator partnerships, and menu merchandising.',
          '3. Days 61-90: expand city marketing, optimize unit economics, and prepare the next location or format.',
        ]
      : [
          '1. Days 1-30: validate launch positioning, content hooks, and first-city conversion.',
          '2. Days 31-60: scale best-performing acquisition paths and refine merchandising.',
          '3. Days 61-90: deepen retention loops and prepare expansion to next cities/channels.',
        ]),
    '',
    '## Artifacts',
    ...[
      '/shopify/config/settings_data.json',
      '/shopify/templates/index.json',
      '/shopify/locales/en.default.json',
      '/seo/geo-pages.json',
    ].map(path => `- ${path}`),
  ].join('\n');

  return {
    brand: {
      idea: memory.idea.raw,
      category: memory.idea.category,
      brand_name: memory.visual.brand_name,
      summary:
        category === 'restaurant'
          ? 'An India-first restaurant launch that combines city-specific hospitality positioning, a differentiated dining brand system, and coordinated execution across research, GTM, Shopify, ads, and SEO.'
          : 'An India-first fast-delivery D2C launch that combines expressive brand identity, urgency-led merchandising, and cross-agent memory compounding.',
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
      ...(category === 'restaurant'
        ? [
            'Days 1-30: validate launch-city demand, reservation flow, and hero dish mix.',
            'Days 31-60: sharpen repeat dining loops, creator partnerships, and menu merchandising.',
            'Days 61-90: expand city marketing, optimize unit economics, and prepare the next location or format.',
          ]
        : [
            'Days 1-30: validate creative hooks, city demand, and hero SKU conversion.',
            'Days 31-60: scale winning campaigns and deepen gifting bundles.',
            'Days 61-90: expand to new cities and introduce repeat-purchase mechanics.',
          ]),
    ],
    artifacts: [
      { path: '/shopify/config/settings_data.json', description: 'Dawn-compatible theme settings for palette, typography, and core theme tokens.' },
      { path: '/shopify/templates/index.json', description: 'Homepage template with ordered Dawn sections and launch copy.' },
      { path: '/shopify/locales/en.default.json', description: 'Localized storefront labels and CTA strings.' },
      { path: '/seo/geo-pages.json', description: 'AI-citation-ready GEO page pack.' },
    ],
    markdown,
  };
}

export function normalizeLaunchBible(memory: BuilderMemory, input: LaunchBibleGeneration): LaunchBible {
  if (!memory.idea || !memory.research || !memory.visual || !memory.domains || !memory.gtm || !memory.shopify || !memory.ads || !memory.seo) {
    throw new Error('Launch memory is incomplete.');
  }

  return {
    ...input,
    shopify_files: {
      ...memory.shopify,
      ...input.shopify_files,
      templates: input.shopify_files.templates ?? memory.shopify.templates,
      files: input.shopify_files.files ?? memory.shopify.files,
      package_summary: input.shopify_files.package_summary ?? memory.shopify.package_summary,
    },
  };
}
