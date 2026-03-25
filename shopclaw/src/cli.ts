#!/usr/bin/env node
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn } from 'node:child_process';
import { getLaunchRun, getLaunchStatus, resumeLaunch, selectVisualConcept, startLaunch } from './mastra/services/openclaw-launch-service.js';

function parseIdeaFromArgs(): string | undefined {
  const args = process.argv.slice(2);
  const ideaFlagIndex = args.findIndex(arg => arg === '--idea');
  if (ideaFlagIndex >= 0) {
    return args.slice(ideaFlagIndex + 1).join(' ').trim() || undefined;
  }

  const positional = args.join(' ').trim();
  return positional || undefined;
}

function openUrl(url: string): void {
  const command =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';

  const child =
    process.platform === 'win32'
      ? spawn('cmd', ['/c', command, url], { stdio: 'ignore', detached: true })
      : spawn(command, [url], { stdio: 'ignore', detached: true });
  child.unref();
}

function printStatus(launchId: string): void {
  const status = getLaunchStatus(launchId);
  output.write(`\nStatus: ${status.status}${status.phase ? ` (${status.phase})` : ''}\n`);
  if (status.current_agent) {
    output.write(`Current agent: ${status.current_agent}\n`);
  }
  if (status.completed_agents?.length) {
    output.write(`Completed: ${status.completed_agents.join(', ')}\n`);
  }
  if (status.pending_reason) {
    output.write(`Pending: ${status.pending_reason}\n`);
  }
  if (status.error) {
    output.write(`Error: ${status.error}\n`);
  }
}

async function withStatusUpdates<T>(launchId: string, action: () => Promise<T>): Promise<T> {
  let previousSnapshot = '';
  const interval = setInterval(() => {
    try {
      const status = getLaunchStatus(launchId);
      const snapshot = `${status.status}|${status.phase}|${status.current_agent}|${status.completed_agents?.length ?? 0}`;
      if (snapshot !== previousSnapshot) {
        previousSnapshot = snapshot;
        printStatus(launchId);
      }
    } catch {
      return;
    }
  }, 500);

  try {
    return await action();
  } finally {
    clearInterval(interval);
  }
}

async function promptForAnswers(questions: { question: string; assumption?: string }[], rl: ReturnType<typeof createInterface>) {
  const answers: string[] = [];
  for (const [index, question] of questions.entries()) {
    const fallback = question.assumption ? ` [default: ${question.assumption}]` : '';
    const answer = await rl.question(`${index + 1}. ${question.question}${fallback}\n> `);
    answers.push(answer.trim() || question.assumption || '');
  }
  return answers;
}

async function promptForConceptSelection(launchId: string, rl: ReturnType<typeof createInterface>) {
  const run = getLaunchRun(launchId);
  const concepts = run?.memory.visual?.logo_concepts ?? [];
  output.write('\nVisual concepts:\n');
  concepts.forEach((concept, index) => {
    output.write(`${index + 1}. ${concept.name} [${concept.mood}]\n`);
    output.write(`   URL: ${concept.image_url}\n`);
  });

  const openAnswer = await rl.question('\nOpen all concept URLs in your browser? (y/N)\n> ');
  if (/^y(es)?$/i.test(openAnswer.trim())) {
    concepts.forEach(concept => openUrl(concept.image_url));
  }

  const selected = await rl.question('\nChoose a concept number (1-3)\n> ');
  const conceptIndex = Math.max(0, Math.min(2, Number.parseInt(selected, 10) - 1 || 0));
  return conceptIndex;
}

function printFinalReport(launchId: string): void {
  const run = getLaunchRun(launchId);
  const report = run?.report;
  if (!report) {
    output.write('\nLaunch completed without a final report payload.\n');
    return;
  }

  output.write('\nLaunch complete.\n');
  output.write(`Brand: ${report.brand.brand_name}\n`);
  output.write(`Recommended domain: ${report.domain.recommended}\n`);
  output.write(`Priority cities: ${report.gtm.launch_cities.join(', ')}\n`);
  output.write(`Artifacts:\n`);
  report.artifacts.forEach(artifact => output.write(`- ${artifact.path}: ${artifact.description}\n`));
  output.write('\nMarkdown summary:\n');
  output.write(`${report.markdown}\n`);
}

async function main() {
  const rl = createInterface({ input, output });

  try {
    const seededIdea = parseIdeaFromArgs();
    const idea =
      seededIdea ??
      (await rl.question('Founder idea:\n> ')).trim() ??
      '';

    if (!idea) {
      throw new Error('A founder idea is required.');
    }

    const launch = await startLaunch(idea);
    output.write(`\nLaunch created: ${launch.id}\n`);
    printStatus(launch.id);

    const answers = await promptForAnswers(launch.pendingQuestions, rl);
    const visualCheckpoint = await withStatusUpdates(launch.id, () => resumeLaunch(launch.id, answers));
    output.write('\nReached visual-selection checkpoint.\n');
    printStatus(launch.id);

    if (visualCheckpoint.phase !== 'visual-selection') {
      throw new Error(`Expected visual-selection checkpoint, received ${visualCheckpoint.phase ?? visualCheckpoint.status}.`);
    }

    const conceptIndex = await promptForConceptSelection(launch.id, rl);
    await withStatusUpdates(launch.id, () => selectVisualConcept(launch.id, conceptIndex));
    printFinalReport(launch.id);
  } finally {
    rl.close();
  }
}

main().catch(error => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error, null, 2)
        : String(error);
  console.error(`CLI failed: ${message}`);
  process.exitCode = 1;
});
