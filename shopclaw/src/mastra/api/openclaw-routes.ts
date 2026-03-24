import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { getLaunchRun, startLaunch } from '../services/openclaw-launch-service.js';

const launchRequestSchema = z.object({
  idea: z.string().min(10),
});

export const openclawApiRoutes = [
  registerApiRoute('/launch', {
    method: 'POST',
    requiresAuth: false,
    handler: async c => {
      const body = launchRequestSchema.parse(await c.req.json());
      const run = startLaunch(body.idea);

      return c.json(
        {
          id: run.id,
          status: run.status,
          currentAgent: run.currentAgent,
        },
        202,
      );
    },
  }),
  registerApiRoute('/launch/:id', {
    method: 'GET',
    requiresAuth: false,
    handler: async c => {
      const run = getLaunchRun(c.req.param('id'));
      if (!run) {
        return c.json({ error: 'Launch run not found' }, 404);
      }

      return c.json(run);
    },
  }),
];
