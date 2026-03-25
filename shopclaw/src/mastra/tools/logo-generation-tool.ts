import { createTool } from '@mastra/core/tools';
import { logoGenerationInputSchema, logoGenerationOutputSchema } from '../domain/openclaw/schemas.js';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const logoGenerationTool = createTool({
  id: 'openclaw-logo-generation-tool',
  description: 'Generate a logo concept payload from brand context using a Nanobanana-shaped contract.',
  inputSchema: logoGenerationInputSchema,
  outputSchema: logoGenerationOutputSchema,
  execute: async ({ prompt, style, brand_context }) => {
    const brandName = brand_context.split(/\s+/).slice(0, 2).join(' ').trim() || 'OpenClaw';
    return {
      name: `${brandName} ${style[0]!.toUpperCase()}${style.slice(1)}`,
      mood: style,
      prompt,
      image_url: `https://assets.openclaw.local/${slugify(brandName)}-${style}.png`,
      provider: 'nanobanana-stub',
    };
  },
});
