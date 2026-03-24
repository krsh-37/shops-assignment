import { readFile } from 'node:fs/promises';

const logFilePath = '.mastra/logs/phase-01.log';

try {
  const content = await readFile(logFilePath, 'utf8');
  process.stdout.write(content);
} catch (error) {
  const err = error as NodeJS.ErrnoException;

  if (err.code === 'ENOENT') {
    process.stderr.write(`No log file found at ${logFilePath}\n`);
    process.exitCode = 1;
  } else {
    throw error;
  }
}
