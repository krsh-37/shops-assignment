import { runLaunch } from '../src/mastra/services/openclaw-launch-service.js';

export const sampleIdea = 'I want to sell custom socks delivered in 10 minutes like Zepto but for socks.';
export const genericIdea = 'I want to launch a premium herbal tea brand for busy professionals in India.';

export async function createCompletedRun(idea = sampleIdea) {
  return runLaunch(idea);
}
