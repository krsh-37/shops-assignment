# ShopClaw

Phase 01 scaffold for the ShopClaw implementation. This repo starts from `create-mastra`, keeps the required folder layout, and now implements the orchestrator entrypoint plus clarification gating.

## Runtime

- Node.js `20+`
- TypeScript
- Mastra
- Zod
- local CLI runner for the orchestrator
- `pnpm` preferred by the phase docs, but it is not installed in this environment

## Structure

```text
shopclaw/
  mastra/
    agents/
    tools/
    memory/
    workflows/
    index.ts
  docs/
  test/
  README.md
  DESIGN.md
  DEMO.md
  CHANGELOG.md
```

## Commands

```sh
npm run dev
npm run build
npm test
npm run phase1:run -- --prompt "I want to launch a premium tea brand"
npm run phase1:logs
```

Mastra is pointed at `./mastra` with `--dir` so the runtime layout matches the phase requirement instead of the default `src/mastra` scaffold.

## Phase 01 Status

- Founder prompt validation is implemented
- Run-scoped launch records persist to `.mastra/state/launch-runs.json`
- Clarification is batched and blocks downstream agents until complete
- Operator logs are written to `.mastra/logs/phase-01.log`

See [`docs/runtime.md`](./docs/runtime.md) for scaffold notes.

Additional docs:

- [`docs/code-walkthrough.md`](./docs/code-walkthrough.md)
- [`docs/testing.md`](./docs/testing.md)
- [`docs/example-phase-01-run.md`](./docs/example-phase-01-run.md)
