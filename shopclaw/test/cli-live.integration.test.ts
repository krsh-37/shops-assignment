import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
const projectRoot = process.cwd();

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

async function runCommand(command: string, args: string[], input?: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    stdout += chunk;
  });
  child.stderr.on('data', chunk => {
    stderr += chunk;
  });

  if (input) {
    child.stdin.write(input);
  }
  child.stdin.end();

  const [code] = (await once(child, 'close')) as [number | null];
  return { code, stdout, stderr };
}

async function runCliConversation(idea: string, answers: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  const child = spawn('node', ['./node_modules/.cache/openclaw-cli-dist/cli.js', '--idea', idea], {
    cwd: projectRoot,
    env: process.env,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stdout = '';
  let stderr = '';
  let promptCount = 0;

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => {
    stdout += chunk;
    const promptMatches = chunk.match(/> /g) ?? [];
    for (const _ of promptMatches) {
      const answer = answers[promptCount];
      promptCount += 1;
      if (answer !== undefined) {
        child.stdin.write(`${answer}\n`);
        if (promptCount >= answers.length) {
          child.stdin.end();
        }
      }
    }
  });
  child.stderr.on('data', chunk => {
    stderr += chunk;
  });

  const [code] = (await once(child, 'close')) as [number | null];
  return { code, stdout, stderr };
}

test('live CLI run completes a restaurant launch without sock fallback output', {
  skip: process.env.OPENCLAW_LIVE_TEST !== '1' || !hasLiveEnv(),
  timeout: 240_000,
}, async () => {
  const compile = await runCommand('node', ['./node_modules/typescript/lib/_tsc.js', '-p', 'tsconfig.cli.json']);
  assert.equal(compile.code, 0, compile.stderr || compile.stdout);

  const cli = await runCliConversation('I want to start a restaurant', ['chennai', '300 to 500', 'd2c', 'n', '1']);

  assert.equal(cli.code, 0, cli.stderr || cli.stdout);
  assert.match(cli.stdout, /Launch complete\./);
  assert.match(cli.stdout, /Category: restaurant/);
  assert.doesNotMatch(cli.stdout, /socks/i);
  assert.doesNotMatch(cli.stdout, /IWant\b/);
  assert.doesNotMatch(cli.stdout, /chennai,\s*chennai/i);
});
