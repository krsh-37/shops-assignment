import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context';
import type { ToolExecutionContext } from '@mastra/core/tools';

export function getThreadIdFromToolContext(context: ToolExecutionContext<any, any>): string | undefined {
  return (
    context.agent?.threadId ??
    (context.requestContext?.get(MASTRA_THREAD_ID_KEY as any) as string | undefined) ??
    undefined
  );
}
