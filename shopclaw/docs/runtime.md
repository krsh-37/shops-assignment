# Runtime Notes

## Phase 01

This directory contains local runtime notes for the ShopClaw code root.

- Scaffold source: `npx create-mastra@latest`
- Runtime directory override: `mastra/` via `mastra --dir ./mastra`
- Required local folders: `mastra/`, `test/`, `docs/`
- Node target: `20+`
- Preferred package manager from the task docs: `pnpm`
- Current executable package manager in this environment: `npm`
- Orchestrator state file: `.mastra/state/launch-runs.json`
- Orchestrator log file: `.mastra/logs/phase-01.log`

## Phase 01 Commands

Start a new run:

```sh
npm run phase1:run -- --prompt "Launch a premium tea brand for busy office workers"
```

Resume a paused run:

```sh
npm run phase1:run -- --resume <run-id> --target-cities "Mumbai, Bengaluru" --price-point "INR 499" --channel-strategy "D2C first"
```

Show persisted logs:

```sh
npm run phase1:logs
```

## Next Phase Hand-off

- Add specialist agents under `mastra/agents`
- Expand `mastra/tools` using `createTool()`
- Replace the stubbed downstream execution with real agents
- Expand the shared memory layer beyond the launch record
