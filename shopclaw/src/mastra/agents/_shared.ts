import { Agent } from '@mastra/core/agent';
import { sharedAgentMemory } from '../memory/shared-agent-memory.js';

export const defaultModel = 'openai/gpt-4.1-nano';

export function createOpenClawAgent(config: ConstructorParameters<typeof Agent>[0]) {
  return new Agent({
    ...config,
    memory: sharedAgentMemory,
  });
}
