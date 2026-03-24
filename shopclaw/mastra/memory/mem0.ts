import { z } from 'zod';

export const openClawMemorySchema = z.object({
  idea: z
    .object({
      raw: z.string(),
      brandNameCandidates: z.array(z.string()).default([]),
      category: z.string().default(''),
    })
    .default({
      raw: '',
      brandNameCandidates: [],
      category: '',
    }),
  research: z.record(z.string(), z.unknown()).default({}),
  visual: z.record(z.string(), z.unknown()).default({}),
  domains: z.record(z.string(), z.unknown()).default({}),
  gtm: z.record(z.string(), z.unknown()).default({}),
  shopify: z.record(z.string(), z.unknown()).default({}),
  seo: z.record(z.string(), z.unknown()).default({}),
  auditLog: z
    .array(
      z.object({
        agent: z.string(),
        action: z.string(),
        timestamp: z.string(),
        keysWritten: z.array(z.string()),
      }),
    )
    .default([]),
});

export type OpenClawMemory = z.infer<typeof openClawMemorySchema>;
