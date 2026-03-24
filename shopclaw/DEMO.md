# Demo

## Phase 01

The Phase 01 demo is the orchestrator entrypoint and clarification gate.

Suggested demo sequence:

- run `npm run phase1:run -- --prompt "Launch a premium tea brand"`
- inspect the paused response and the generated `runId`
- resume with the missing answers using `--resume`
- inspect `.mastra/logs/phase-01.log` or run `npm run phase1:logs`
