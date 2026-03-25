import test from 'node:test';
import assert from 'node:assert/strict';
import { gtmAgent } from '../src/mastra/agents/index.js';
import { isDevMode } from '../src/mastra/config/openclaw-config.js';
import { normalizeGTM } from '../src/mastra/domain/openclaw/content.js';
import { gtmPlanTool } from '../src/mastra/tools/index.js';
import { createCompletedRun } from './test-helpers.js';

test('gtm agent exposes plan generation tool', async () => {
  const tools = await gtmAgent.listTools();

  assert.equal('gtmPlanTool' in tools, !isDevMode());
});

test('gtm plan tool returns a full India-first plan', async () => {
  const run = await createCompletedRun();
  const result = await (gtmPlanTool.execute as any)({ memory: run.memory }, {});

  assert.equal(result.reel_ideas.length, 10);
  assert.ok(result.launch_cities.length >= 3);
});

test('gtm agent functionality populates launch channels and checklist', async () => {
  const run = await createCompletedRun();

  assert.ok(run.memory.gtm);
  assert.equal(run.memory.gtm?.reel_ideas.length, 10);
  assert.ok((run.memory.gtm?.week1_checklist.length ?? 0) >= 5);
});

test('gtm normalization keeps founder-selected cities first', async () => {
  const normalized = normalizeGTM(
    {
      idea: {
        raw: 'I want to start a restaurant',
        category: 'restaurant',
        brand_name_candidates: ['RestaurantHive'],
        clarification_questions: [],
        clarification_answers: ['Chennai'],
      },
      brief: {
        answers: [
          {
            question_id: 'launch-cities',
            question: 'Which Indian cities should we prioritise for the first launch wave?',
            answer: 'Chennai',
            target_sections: ['brief', 'research', 'gtm', 'ads', 'seo'],
          },
        ],
        founder_brief: 'Which Indian cities should we prioritise for the first launch wave?: Chennai',
      },
      audit_log: [],
    } as any,
    {
      launch_cities: ['Bengaluru', 'Mumbai', 'Chennai'],
      channels: { instagram: '40%', whatsapp: '30%', google: '30%' },
      reel_ideas: Array.from({ length: 10 }, (_, index) => `idea ${index + 1}`),
      influencer_brief: 'Launch in Bengaluru first.',
      week1_checklist: ['a', 'b', 'c', 'd', 'e'],
    },
  );

  assert.equal(normalized.launch_cities[0], 'Chennai');
});

test('gtm normalization falls back when model omits launch cities', async () => {
  const normalized = normalizeGTM(
    {
      idea: {
        raw: 'I want to start a restaurant',
        category: 'restaurant',
        brand_name_candidates: ['RestaurantHive'],
        clarification_questions: [],
        clarification_answers: ['Chennai'],
      },
      brief: {
        answers: [
          {
            question_id: 'launch-cities',
            question: 'Which Indian cities should we prioritise for the first launch wave?',
            answer: 'Chennai',
            target_sections: ['brief', 'research', 'gtm', 'ads', 'seo'],
          },
        ],
        founder_brief: 'Which Indian cities should we prioritise for the first launch wave?: Chennai',
      },
      audit_log: [],
    } as any,
    {
      channels: { instagram: '50%', whatsapp: '30%', google: '20%' },
      influencer_brief: 'Test brief',
    } as any,
  );

  assert.equal(normalized.launch_cities[0], 'Chennai');
  assert.equal(normalized.reel_ideas.length, 10);
  assert.ok(normalized.week1_checklist.length >= 5);
});
