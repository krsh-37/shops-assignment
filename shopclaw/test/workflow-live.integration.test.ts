import test from 'node:test';
import assert from 'node:assert/strict';
import { startLaunch, resumeLaunch, selectVisualConcept, getLaunchRun } from '../src/mastra/services/openclaw-launch-service.js';

function hasLiveEnv() {
  return Boolean(
    process.env.OPENCLAW_MODE === 'dev' &&
      process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
      process.env.TAVILY_API_KEY &&
      process.env.MEM0_API_KEY &&
      process.env.MEM0_ORG_ID &&
      process.env.MEM0_PROJECT_ID,
  );
}

test('live workflow run completes a restaurant launch without sock fallback output', {
  skip: process.env.OPENCLAW_LIVE_TEST !== '1' || !hasLiveEnv(),
  timeout: 240_000,
}, async () => {
  const launch = await startLaunch('I want to start a restaurant');
  const visualCheckpoint = await resumeLaunch(launch.id, ['Chennai', '300 to 500', 'D2C']);

  assert.equal(visualCheckpoint.phase, 'visual-selection');

  const completion = await selectVisualConcept(launch.id, 1);
  assert.equal(completion.status, 'completed');

  const run = getLaunchRun(launch.id);
  assert.ok(run?.report);

  const reportText = JSON.stringify(run?.report);
  assert.match(reportText, /restaurant/i);
  assert.doesNotMatch(reportText, /socks/i);
  assert.doesNotMatch(reportText, /IWant\b/);
  assert.equal(run?.report?.gtm.launch_cities.join(', '), 'Chennai');
});
