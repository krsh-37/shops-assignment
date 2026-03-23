import type { ResearchReport, VisualConcept, VisualMemory } from '../memory/mem0.ts';
import { type InMemoryRunScopedMemoryStore } from '../memory/mem0.ts';

function buildVisualConcepts(research: ResearchReport): [VisualConcept, VisualConcept, VisualConcept] {
  const baseTheme = research.keywords.primary[0] ?? 'brand';
  return [
    {
      name: `${baseTheme} Bold`,
      mood: 'bold',
      prompt: `Bold wordmark for ${baseTheme} with electric accent colors and high contrast`,
    },
    {
      name: `${baseTheme} Clean`,
      mood: 'premium',
      prompt: `Geometric icon system for ${baseTheme} with minimal sans-serif styling`,
    },
    {
      name: `${baseTheme} Playful`,
      mood: 'playful',
      prompt: `Illustrated mascot direction for ${baseTheme} with friendly rounded shapes`,
    },
  ];
}

function buildPalette(research: ResearchReport): string[] {
  if (research.keywords.primary[0]?.toLowerCase().includes('sock')) {
    return ['#FF6B2C', '#1F2937', '#FFF4E8'];
  }

  return ['#111827', '#E5E7EB', '#F97316'];
}

export interface VisualAgentOutput {
  visual: VisualMemory;
}

// Implements PRD-006
export async function runVisualAgent(
  runId: string,
  memory: InMemoryRunScopedMemoryStore,
): Promise<VisualAgentOutput> {
  const research = await memory.read(runId, 'research');
  const concepts = buildVisualConcepts(research);

  const visual: VisualMemory = {
    brand_name: research.keywords.primary[0] ?? 'OpenClaw',
    logo_concepts: concepts,
    chosen_concept: 0,
    palette: buildPalette(research),
    font_pairing: 'Inter Tight and Fraunces',
    mood: concepts[0].mood,
  };

  await memory.write(runId, 'visual', visual);
  return { visual };
}
