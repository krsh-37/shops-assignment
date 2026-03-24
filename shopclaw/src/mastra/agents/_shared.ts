import { Agent } from '@mastra/core/agent';
import { sharedAgentMemory } from '../memory/shared-agent-memory.js';

export const defaultModel = 'openai/gpt-5.4';

export function createOpenClawAgent(config: ConstructorParameters<typeof Agent>[0]) {
  return new Agent({
    ...config,
    memory: sharedAgentMemory,
  });
}
