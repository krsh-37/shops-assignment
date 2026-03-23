# ShopClaw

This folder contains the runnable code for the ShopClaw implementation.

The repository docs live in `../docs/`.

## What is here

- `mastra/agents/`
- `mastra/memory/mem0.ts`
- `mastra/tools/`
- `mastra/workflows/openclaw.ts`
- `test/`

## Current implemented phases

- Phase 1: run start validation and run-scoped record creation
- Phase 2: clarification gating
- Phase 3: run-scoped memory with schema validation and cross-run isolation
- Phase 4: workflow dependency graph with parallel Research and Domain execution
- Phase 5: Research, Visual, and Domain agent outputs

## How to test

```bash
cd shopclaw
npm test
```

Optional coverage:

```bash
node --test --experimental-strip-types --experimental-test-coverage test/*.test.ts
```

## Notes

- The code is intentionally separated from the documentation under `../docs/`.
- Later phases remain to be implemented.
