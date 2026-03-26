type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const ANSI = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  orange: '\x1b[38;5;208m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
} as const;

function truncateString(value: string, maxLength = 150): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function summarizeObjectCompact(value: Record<string, unknown>): string {
  const compact = Object.fromEntries(
    Object.entries(value)
      .slice(0, 6)
      .map(([key, nested]) => {
        if (nested === null || nested === undefined) {
          return [key, nested ?? null];
        }

        if (typeof nested === 'string') {
          return [key, truncateString(nested, 60)];
        }

        if (typeof nested === 'number' || typeof nested === 'boolean') {
          return [key, nested];
        }

        if (Array.isArray(nested)) {
          return [key, `[${nested.length} items]`];
        }

        return [key, '[object]'];
      }),
  );

  return truncateString(JSON.stringify(compact));
}

function summarize(value: unknown, depth = 0): JsonValue {
  if (value === null || value === undefined) {
    return value ?? null;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    if (depth >= 2) {
      return value.slice(0, 6).map(item => summarize(item, depth + 1));
    }
    return value.slice(0, 6).map(item => summarize(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= 2) {
      return summarizeObjectCompact(value as Record<string, unknown>);
    }

    const entries = Object.entries(value as Record<string, unknown>).slice(0, 12);
    return Object.fromEntries(entries.map(([key, nested]) => [key, summarize(nested, depth + 1)])) as JsonValue;
  }

  return String(value);
}

export function logRuntime(event: string, payload: Record<string, unknown>): void {
  const body = JSON.stringify(
    {
      event,
      ...Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, summarize(value)])),
    },
    null,
    2,
  );

  const color = colorForEvent(event);
  const prefix = `${color}[openclaw]${ANSI.reset}`;
  const separator = `${ANSI.dim}${'='.repeat(72)}${ANSI.reset}`;
  console.log(`${separator}\n${prefix} ${body}`);
}

function colorForEvent(event: string): string {
  switch (event) {
    case 'mem0.write':
      return ANSI.orange;
    case 'agent.completed':
    case 'launch.completed':
      return ANSI.green;
    case 'agent.memory-input':
      return ANSI.blue;
    case 'mem0.recall':
      return ANSI.cyan;
    case 'mem0.answers':
    case 'visual.selected':
      return ANSI.magenta;
    default:
      return ANSI.yellow;
  }
}
