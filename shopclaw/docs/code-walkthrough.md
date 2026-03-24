# Code Walkthrough

## Goal

Phase 01 implements the safe launch entrypoint:

- accept one founder prompt
- normalize and validate it
- create one run-scoped record
- ask batched clarification questions
- pause until the required answers are present
- publish visible run status

## Main Files

[`mastra/tools/launch-run.ts`](../mastra/tools/launch-run.ts)

- defines the run model
- validates the founder prompt
- creates the initial run record
- provides both in-memory and file-backed stores
- persists run state to `.mastra/state/launch-runs.json`

Key types:

- `LaunchRunRecord`
- `LaunchRunStatus`
- `LaunchStatusEvent`
- `LaunchClarificationInput`

Key functions:

- `normalizeFounderPrompt()`
- `startLaunchRun()`

[`mastra/agents/orchestrator.ts`](../mastra/agents/orchestrator.ts)

- owns clarification gating
- computes missing questions from the current clarification payload
- updates run status history
- blocks downstream execution while clarification is incomplete
- supports resuming an existing run

Key functions:

- `collectClarificationQuestions()`
- `orchestrateLaunchRun()`
- `resumeLaunchRun()`
- `publishRunStatus()`

Status flow:

1. `initialized`
2. `paused` if required clarification is missing
3. `ready` when all clarification answers are present

[`mastra/workflows/openclaw.ts`](../mastra/workflows/openclaw.ts)

- provides the Phase 01 workflow wrapper
- keeps the public entrypoint small
- separates “start new run” from “resume existing run”

Exports:

- `startOpenClawWorkflow()`
- `continueOpenClawWorkflow()`

[`scripts/run-phase-01.ts`](../scripts/run-phase-01.ts)

- is the operator-facing CLI
- parses `--prompt` and `--resume`
- writes structured logs to `.mastra/logs/phase-01.log`
- writes run records through `FileLaunchRunStore`
- prints the final JSON result to stdout

[`scripts/show-phase-01-log.ts`](../scripts/show-phase-01-log.ts)

- prints the persisted log file as newline-delimited JSON

## Runtime Flow

1. The CLI reads the founder prompt or resume arguments.
2. The CLI creates a `FileLaunchRunStore`.
3. `startOpenClawWorkflow()` or `continueOpenClawWorkflow()` is called.
4. The orchestrator creates or reloads the run record.
5. The orchestrator computes missing clarification questions.
6. If questions are missing, the run is saved as `paused`.
7. If all answers are present, the run is saved as `ready`.
8. Each status change is appended to `statusHistory`.
9. Each visible event is written to `.mastra/logs/phase-01.log`.

## Why The State And Logs Are Separate

- `.mastra/state/launch-runs.json` is the source of truth for the latest run state.
- `.mastra/logs/phase-01.log` is an append-only operator trail.

This split matters because state answers “what is the run now?” while logs answer “how did it get here?”

## Current Boundary

Phase 01 intentionally stops before specialist agents start.

- downstream execution is still stubbed
- no shared memory writes beyond the launch record happen yet
- no workflow DAG or parallel agent execution happens yet
