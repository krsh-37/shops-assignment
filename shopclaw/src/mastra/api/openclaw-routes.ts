import { registerApiRoute } from '@mastra/core/server';
import { z } from 'zod';
import { getLaunchRun } from '../services/openclaw-launch-service.js';
import {
  answerClarificationsThroughOrchestrator,
  chooseVisualThroughOrchestrator,
  getLaunchStatusThroughOrchestrator,
  handleOrchestratorMessage,
  submitIdeaToOrchestrator,
} from '../services/openclaw-orchestrator-service.js';

const launchRequestSchema = z.object({
  idea: z.string().min(10),
});

const launchAnswersSchema = z.object({
  answers: z.array(z.string()).min(1),
});

const visualSelectionSchema = z.object({
  conceptIndex: z.number().int().min(0).max(2),
});

const orchestratorMessageSchema = z.object({
  message: z.string().optional(),
  launchId: z.string().optional(),
  answers: z.array(z.string()).optional(),
  conceptIndex: z.number().int().min(0).max(2).optional(),
});

export const openclawApiRoutes = [
  registerApiRoute('/launch', {
    method: 'POST',
    requiresAuth: false,
    handler: async c => {
      const body = launchRequestSchema.parse(await c.req.json());
      const control = await submitIdeaToOrchestrator(body.idea);

      return c.json(
        {
          id: control.launchId,
          status: control.status,
          phase: control.phase,
          nextAction: control.next_action,
          pendingQuestions: control.pending_questions,
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
  registerApiRoute('/launch/:id/status', {
    method: 'GET',
    requiresAuth: false,
    handler: async c => {
      try {
        return c.json(await getLaunchStatusThroughOrchestrator(c.req.param('id')));
      } catch {
        return c.json({ error: 'Launch run not found' }, 404);
      }
    },
  }),
  registerApiRoute('/launch/:id/answers', {
    method: 'POST',
    requiresAuth: false,
    handler: async c => {
      try {
        const body = launchAnswersSchema.parse(await c.req.json());
        const control = await answerClarificationsThroughOrchestrator(c.req.param('id'), body.answers);
        return c.json(control);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to resume launch';
        const status = /was not found/.test(message) ? 404 : 400;
        return c.json({ error: message }, status);
      }
    },
  }),
  registerApiRoute('/launch/:id/visual-selection', {
    method: 'POST',
    requiresAuth: false,
    handler: async c => {
      try {
        const body = visualSelectionSchema.parse(await c.req.json());
        const control = await chooseVisualThroughOrchestrator(c.req.param('id'), body.conceptIndex);
        return c.json(control);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to select visual concept';
        const status = /was not found/.test(message) ? 404 : 400;
        return c.json({ error: message }, status);
      }
    },
  }),
  registerApiRoute('/orchestrator/message', {
    method: 'POST',
    requiresAuth: false,
    handler: async c => {
      try {
        const body = orchestratorMessageSchema.parse(await c.req.json());
        return c.json(await handleOrchestratorMessage(body));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to process orchestrator message';
        const status = /was not found/.test(message) ? 404 : 400;
        return c.json({ error: message }, status);
      }
    },
  }),
];
