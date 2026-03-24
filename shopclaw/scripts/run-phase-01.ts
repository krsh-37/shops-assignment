import { appendFile, mkdir } from 'node:fs/promises';
import { PinoLogger } from '@mastra/loggers';
import type { LaunchStatusEvent } from '../mastra/tools/launch-run.js';
import { FileLaunchRunStore } from '../mastra/tools/launch-run.js';
import { continueOpenClawWorkflow, startOpenClawWorkflow } from '../mastra/workflows/openclaw.js';

const logger = new PinoLogger({
  name: 'ShopClaw Phase 01',
  level: process.env.MASTRA_LOG_LEVEL || 'info',
});

const logFilePath = '.mastra/logs/phase-01.log';
const stateFilePath = '.mastra/state/launch-runs.json';

interface CliArgs {
  prompt?: string;
  resume?: string;
  targetCities?: string;
  pricePoint?: string;
  channelStrategy?: string;
  showRuns?: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextToken = argv[index + 1];

    switch (token) {
      case '--prompt':
        args.prompt = nextToken;
        index += 1;
        break;
      case '--resume':
        args.resume = nextToken;
        index += 1;
        break;
      case '--target-cities':
        args.targetCities = nextToken;
        index += 1;
        break;
      case '--price-point':
        args.pricePoint = nextToken;
        index += 1;
        break;
      case '--channel-strategy':
        args.channelStrategy = nextToken;
        index += 1;
        break;
      case '--show-runs':
        args.showRuns = true;
        break;
      default:
        if (!token.startsWith('--') && !args.prompt && !args.resume) {
          args.prompt = token;
        }
        break;
    }
  }

  return args;
}

async function appendStructuredLog(record: Record<string, unknown>): Promise<void> {
  await mkdir('.mastra/logs', { recursive: true });
  await appendFile(logFilePath, `${JSON.stringify(record)}\n`, 'utf8');
}

function buildClarification(args: CliArgs) {
  return {
    targetCities: args.targetCities,
    pricePoint: args.pricePoint,
    channelStrategy: args.channelStrategy,
  };
}

async function logStatus(event: LaunchStatusEvent, runId: string): Promise<void> {
  logger.info(event.message, {
    runId,
    status: event.status,
    actor: event.actor,
    details: event.details,
  });

  await appendStructuredLog({
    timestamp: event.timestamp,
    runId,
    status: event.status,
    actor: event.actor,
    message: event.message,
    details: event.details,
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const store = new FileLaunchRunStore(stateFilePath);

  if (args.showRuns) {
    const runs = await store.list();
    console.log(JSON.stringify(runs, null, 2));
    return;
  }

  const clarification = buildClarification(args);
  const hooks = {
    onStatus: async (event: LaunchStatusEvent, run: { runId: string }) => {
      await logStatus(event, run.runId);
    },
    startDownstreamWork: async (run: { runId: string }) => {
      logger.info('Downstream execution remains stubbed in Phase 01.', {
        runId: run.runId,
      });
      await appendStructuredLog({
        timestamp: new Date().toISOString(),
        runId: run.runId,
        status: 'ready',
        actor: 'orchestrator',
        message: 'Phase 01 stops before non-orchestrator agents start.',
      });
    },
  };

  const result = args.resume
    ? await continueOpenClawWorkflow(args.resume, store, clarification, undefined, hooks)
    : await startOpenClawWorkflow(args.prompt, store, clarification, undefined, hooks);

  console.log(JSON.stringify({
    result,
    stateFilePath,
    logFilePath,
  }, null, 2));
}

main().catch(async (error) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Phase 01 run failed.', { err: message });
  await appendStructuredLog({
    timestamp: new Date().toISOString(),
    status: 'failed',
    actor: 'orchestrator',
    message,
  });
  process.exitCode = 1;
});
