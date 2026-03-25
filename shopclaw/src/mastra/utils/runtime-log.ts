type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function truncateString(value: string, maxLength = 600): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
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
      return [`[${value.length} items]`];
    }
    return value.slice(0, 6).map(item => summarize(item, depth + 1));
  }

  if (typeof value === 'object') {
    if (depth >= 2) {
      return '[object]' as unknown as JsonValue;
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

  console.log(`[openclaw] ${body}`);
}
