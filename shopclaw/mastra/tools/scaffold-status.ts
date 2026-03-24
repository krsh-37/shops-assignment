import { z } from 'zod';

export const scaffoldStatusInputSchema = z.object({
  phase: z.string().default('phase-00'),
});

export const scaffoldStatusOutputSchema = z.object({
  phase: z.string(),
  status: z.literal('initialized'),
  codeRoot: z.literal('shopclaw'),
});

export const scaffoldStatusToolDefinition = {
  id: 'scaffold-status',
  description: 'Placeholder tool contract for scaffold validation.',
  inputSchema: scaffoldStatusInputSchema,
  outputSchema: scaffoldStatusOutputSchema,
} as const;

export function getScaffoldStatus(phase = 'phase-00') {
  return scaffoldStatusOutputSchema.parse({
    phase,
    status: 'initialized',
    codeRoot: 'shopclaw',
  });
}
