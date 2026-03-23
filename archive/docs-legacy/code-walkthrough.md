# Code Walkthrough

This is the one document to use when you want to understand the codebase end to end.

## Directory Structure Overview

The repo is split into docs and runnable code:

```text
shops-assignment/
  docs/
    code-walkthrough.md
    plan.md
    verification.md
    PRDs/
    ...
  shopclaw/
    package.json
    README.md
    mastra/
      agents/
      memory/
      tools/
      workflows/
    test/
```

What each top-level area means:

- `docs/` is for requirements, plans, audits, and walkthroughs
- `shopclaw/` is the runnable implementation and test suite
- `docs/PRDs/` contains the phase-by-phase requirement split
- `shopclaw/mastra/` contains the implementation modules
- `shopclaw/test/` contains the behavior checks

## Reading Order

Read the code in this order, from foundation to application:

1. [`docs/plan.md`](./plan.md)
2. [`docs/2.PRD.md`](./2.PRD.md)
3. [`docs/3. TDD.md`](./3.%20TDD.md)
4. [`shopclaw/README.md`](../shopclaw/README.md)
5. [`shopclaw/mastra/tools/launch-run.ts`](../shopclaw/mastra/tools/launch-run.ts)
6. [`shopclaw/mastra/agents/orchestrator.ts`](../shopclaw/mastra/agents/orchestrator.ts)
7. [`shopclaw/mastra/memory/mem0.ts`](../shopclaw/mastra/memory/mem0.ts)
8. [`shopclaw/mastra/workflows/openclaw.ts`](../shopclaw/mastra/workflows/openclaw.ts)
9. [`shopclaw/mastra/agents/research.ts`](../shopclaw/mastra/agents/research.ts)
10. [`shopclaw/mastra/agents/visual.ts`](../shopclaw/mastra/agents/visual.ts)
11. [`shopclaw/mastra/agents/domain.ts`](../shopclaw/mastra/agents/domain.ts)

Why this order works:

- `plan.md` explains the intended shape of the implementation
- `2.PRD.md` tells you what the system must do
- `3. TDD.md` tells you how the design maps to the requirements
- `launch-run.ts` is the first executable behavior
- `orchestrator.ts` controls run gating and status
- `mem0.ts` defines the shared memory contract
- `openclaw.ts` defines the workflow dependency logic
- the agent files define bounded outputs and memory writes

## Complete End-to-End Flow

The current implementation flow is:

1. A founder prompt enters the system.
2. `startLaunchRun` validates and stores the prompt as a run record.
3. The orchestrator checks for missing clarification inputs.
4. If inputs are missing, the run pauses and questions are returned.
5. If inputs are present, the run moves to `ready`.
6. Run-scoped memory stores and validates shared data.
7. The workflow engine starts Research and Domain in parallel.
8. Research writes its report to memory.
9. Visual waits for Research, then writes logo concepts.
10. Domain writes the domain shortlist and recommendation.
11. Later phases will add GTM, Shopify, Ads, SEO/GEO, and the final launch bible.

Current phase coverage:

- implemented: phases 1 through 5
- pending: phases 6 through 9

## Data Flow Diagram

```text
Founder prompt
  |
  v
startLaunchRun
  |
  v
LaunchRunRecord
  |
  v
orchestrateLaunchRun
  | \
  |  \-- if clarification missing --> paused run + question list
  |
  v
RunScopedMemoryStore
  |
  v
runLaunchWorkflow
  |----------------------|
  v                      v
Research agent        Domain agent
  |
  v
Research output in memory
  |
  v
Visual agent reads research
  |
  v
Visual output in memory
```

What flows through the system:

- prompt data enters via the run starter
- run status is controlled by the orchestrator
- structured shared data is stored in the memory layer
- workflow state controls what may run next
- each agent writes a bounded payload back to memory

## Test Files Reading Order

Read the tests in the same order as the code:

1. [`shopclaw/test/launch-run.test.ts`](../shopclaw/test/launch-run.test.ts)
2. [`shopclaw/test/orchestrator.test.ts`](../shopclaw/test/orchestrator.test.ts)
3. [`shopclaw/test/memory.test.ts`](../shopclaw/test/memory.test.ts)
4. [`shopclaw/test/workflow.test.ts`](../shopclaw/test/workflow.test.ts)
5. [`shopclaw/test/agents.test.ts`](../shopclaw/test/agents.test.ts)

What each test file proves:

- `launch-run.test.ts`: validation, trimming, persistence, and failure handling
- `orchestrator.test.ts`: clarification gating and status progression
- `memory.test.ts`: schema checks, run isolation, and cross-run blocking
- `workflow.test.ts`: dependency ordering and pending-step behavior
- `agents.test.ts`: research, visual, and domain output behavior

## Quick Reference: Key Files By Concern

### Run start and record creation

- [`shopclaw/mastra/tools/launch-run.ts`](../shopclaw/mastra/tools/launch-run.ts)

### Clarification gating and run status

- [`shopclaw/mastra/agents/orchestrator.ts`](../shopclaw/mastra/agents/orchestrator.ts)

### Shared memory and schema validation

- [`shopclaw/mastra/memory/mem0.ts`](../shopclaw/mastra/memory/mem0.ts)

### Workflow scheduling

- [`shopclaw/mastra/workflows/openclaw.ts`](../shopclaw/mastra/workflows/openclaw.ts)

### Agent outputs

- [`shopclaw/mastra/agents/research.ts`](../shopclaw/mastra/agents/research.ts)
- [`shopclaw/mastra/agents/visual.ts`](../shopclaw/mastra/agents/visual.ts)
- [`shopclaw/mastra/agents/domain.ts`](../shopclaw/mastra/agents/domain.ts)

### Tests

- [`shopclaw/test/launch-run.test.ts`](../shopclaw/test/launch-run.test.ts)
- [`shopclaw/test/orchestrator.test.ts`](../shopclaw/test/orchestrator.test.ts)
- [`shopclaw/test/memory.test.ts`](../shopclaw/test/memory.test.ts)
- [`shopclaw/test/workflow.test.ts`](../shopclaw/test/workflow.test.ts)
- [`shopclaw/test/agents.test.ts`](../shopclaw/test/agents.test.ts)

## Usage Examples

### Run the tests

```bash
cd shopclaw
npm test
```

### Run coverage

```bash
cd shopclaw
node --test --experimental-strip-types --experimental-test-coverage test/*.test.ts
```

### Inspect the current phase coverage

Open:

- [`docs/plan.md`](./plan.md)
- [`docs/phase-changelog.md`](./phase-changelog.md)
- [`docs/verification.md`](./verification.md)

### Add a new phase

1. Read the next `docs/PRDs/phase-*` files.
2. Add the implementation under `shopclaw/mastra/`.
3. Add matching tests under `shopclaw/test/`.
4. Run `cd shopclaw && npm test`.
5. Update `docs/phase-changelog.md`.
6. Update `docs/plan.md` if the code layout or status changes.

## Debugging Checklist

- If the run never starts, inspect `launch-run.ts`
- If the run pauses too early, inspect `orchestrator.ts`
- If a memory read fails, inspect `mem0.ts`
- If a step stays pending, inspect `openclaw.ts`
- If an agent output is wrong, inspect the matching agent file and its test

## What Is Implemented Right Now

- Phase 1: run start validation
- Phase 2: clarification gating
- Phase 3: run-scoped memory
- Phase 4: workflow ordering
- Phase 5: research, visual, and domain agents

## What Is Not Implemented Yet

- India GTM
- Shopify
- Performance Ads
- SEO/GEO
- final launch bible
- delivery package and demo artifact

## Short Version

If you only read three things, read these:

1. [`docs/plan.md`](./plan.md)
2. [`shopclaw/mastra/tools/launch-run.ts`](../shopclaw/mastra/tools/launch-run.ts)
3. [`shopclaw/mastra/agents/orchestrator.ts`](../shopclaw/mastra/agents/orchestrator.ts)
