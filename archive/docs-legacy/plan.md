# ShopClaw Implementation Plan

This document is the canonical implementation map for the project. It explains what has been built, how the code is organized, what each phase covers, and what remains to complete the full OpenClaw task.

## 1. Project Goal

Build a runnable TypeScript implementation of the OpenClaw brand-launch engine, with docs separated from code, and with each approved PRD phase implemented in order.

The system is intended to:

- accept one founder prompt
- pause for clarification before expensive work
- persist and enforce run-scoped shared memory
- execute dependent workflow steps in the approved order
- generate bounded outputs from each specialist agent
- compile a final launch bible from prior outputs

## 2. Repository Split

The repository is intentionally split into two areas:

- `docs/` contains PRDs, FRDs, task notes, phase tracking, and migration notes
- `shopclaw/` contains all runnable code, tests, package metadata, and runtime README

This separation keeps implementation concerns isolated from requirements and planning material.

## 3. Current Code Layout

The runnable code currently lives under `shopclaw/`:

```text
shopclaw/
  package.json
  README.md
  mastra/
    agents/
      orchestrator.ts
      research.ts
      visual.ts
      domain.ts
    memory/
      mem0.ts
    tools/
      launch-run.ts
    workflows/
      openclaw.ts
  test/
    launch-run.test.ts
    orchestrator.test.ts
    memory.test.ts
    workflow.test.ts
    agents.test.ts
```

The docs remain under `docs/`, including:

- `docs/0.TASK.md`
- `docs/1.SCOPE.md`
- `docs/2.PRD.md`
- `docs/3. TDD.md`
- `docs/PRDs/*`
- `docs/prd_impl.md`
- `docs/prd_implementation_phases.csv`
- `docs/phase-changelog.md`
- `docs/shopclaw-migration-plan.md`

## 4. Phase Status

### Phase 01

Approved scope:

- `PRD-001`

Implemented behavior:

- trim and validate the founder prompt
- reject non-string input
- reject blank input
- generate a run ID
- create one run-scoped launch record
- persist the record in the in-memory store

Primary implementation:

- `shopclaw/mastra/tools/launch-run.ts`

Tests:

- `shopclaw/test/launch-run.test.ts`

### Phase 02

Approved scope:

- `PRD-002`

Implemented behavior:

- collect clarification questions before downstream work
- pause the run when required inputs are missing
- prevent downstream work from starting while clarification is incomplete
- suppress duplicate questions when some inputs already exist
- continue only when the required clarification inputs are available

Primary implementation:

- `shopclaw/mastra/agents/orchestrator.ts`

Tests:

- `shopclaw/test/orchestrator.test.ts`

### Phase 03

Approved scope:

- `PRD-003`
- `PRD-NFR-002`

Implemented behavior:

- persist run-scoped data under the active run ID
- reject writes with invalid schema
- reject reads for missing values
- prevent cross-run memory access
- keep memory isolated across runs

Primary implementation:

- `shopclaw/mastra/memory/mem0.ts`

Tests:

- `shopclaw/test/memory.test.ts`

### Phase 04

Approved scope:

- `PRD-004`, `PRD-014`, `PRD-015`

Implemented behavior:

- start Research and Domain in parallel
- block Visual until Research completes
- keep Shopify pending until GTM is available
- preserve pending steps when prerequisites are missing

Primary implementation:

- `shopclaw/mastra/workflows/openclaw.ts`

Tests:

- `shopclaw/test/workflow.test.ts`

### Phase 05

Approved scope:

- `PRD-005`
- `PRD-006`
- `PRD-007`

Implemented behavior:

- Research writes a structured report
- Visual writes exactly three logo concepts
- Domain writes a ranked shortlist and recommendation
- each agent fails cleanly when required input is missing

Primary implementations:

- `shopclaw/mastra/agents/research.ts`
- `shopclaw/mastra/agents/visual.ts`
- `shopclaw/mastra/agents/domain.ts`

Tests:

- `shopclaw/test/agents.test.ts`

## 5. Approved Requirements Mapping

### Functional Requirements

- `PRD-001`: implemented
- `PRD-002`: implemented
- `PRD-003`: implemented
- `PRD-004`, `PRD-014`, `PRD-015`: implemented
- `PRD-005`: implemented
- `PRD-006`: implemented
- `PRD-007`: implemented
- `PRD-008`: not implemented yet
- `PRD-009`: not implemented yet
- `PRD-010`: not implemented yet
- `PRD-011`: not implemented yet
- `PRD-012`: not implemented yet
- `PRD-013`, `PRD-016`, `PRD-017`, `PRD-018`, `PRD-019`, `PRD-020`: not implemented yet

### Non-Functional Requirements

- `PRD-NFR-001`: not implemented yet as a formal enforced runtime constraint
- `PRD-NFR-002`: implemented

## 6. Core Data Contracts

### Launch Run

Defined in `shopclaw/mastra/tools/launch-run.ts`.

Fields:

- `runId`
- `prompt`
- `status`
- `createdAt`
- `updatedAt`

Statuses:

- `initialized`
- `paused`
- `ready`

### Memory Schema

Defined in `shopclaw/mastra/memory/mem0.ts`.

Keys:

- `idea`
- `research`
- `visual`
- `domains`
- `audit_log`

Current schema intent:

- `idea` stores the original founder prompt
- `research` stores market research output
- `visual` stores three logo concepts and palette data
- `domains` stores top-five domain results and recommendation
- `audit_log` stores append-only run events

### Research Output

Fields:

- competitors
- market_size_inr
- whitespace
- keywords.primary
- keywords.secondary
- india_insight

### Visual Output

Fields:

- brand_name
- logo_concepts
- chosen_concept
- palette
- font_pairing
- mood

### Domain Output

Fields:

- recommended
- top5

Each candidate includes:

- domain
- available
- price
- reason

## 7. Workflow Model

The current workflow implementation is intentionally minimal but preserves the approved dependency order.

Current behavior:

- Research and Domain can begin without waiting on each other
- Visual waits for Research
- Shopify is held pending until GTM is complete
- pending steps stay pending instead of being dropped

The workflow implementation lives in:

- `shopclaw/mastra/workflows/openclaw.ts`

The current test suite validates:

- parallel start for Research and Domain
- Visual blocking on Research
- Shopify staying pending without GTM

## 8. Orchestrator Behavior

The orchestrator is responsible for:

- starting the run
- determining what clarification questions are missing
- pausing when required launch inputs are missing
- resuming when clarification is complete
- passing control to downstream work only when allowed

Current implementation location:

- `shopclaw/mastra/agents/orchestrator.ts`

Clarification questions currently modeled:

- target cities
- price point
- channel strategy

The current implementation treats missing or blank values as unanswered.

## 9. Memory Behavior

The in-memory store is intentionally run-scoped.

Key properties:

- every operation requires the active run ID
- the store rejects invalid data shapes
- the store blocks cross-run reads
- writes are clone-safe to avoid accidental mutation bleed

Current implementation location:

- `shopclaw/mastra/memory/mem0.ts`

## 10. Agent Behavior

### Research Agent

Responsibilities:

- validate founder idea input
- generate a structured research report
- write to shared memory

Implementation:

- `shopclaw/mastra/agents/research.ts`

### Visual Agent

Responsibilities:

- read research from shared memory
- generate exactly three logo concepts
- derive palette and mood from prior research
- write to shared memory

Implementation:

- `shopclaw/mastra/agents/visual.ts`

### Domain Agent

Responsibilities:

- read research when available
- generate five domain candidates
- mark availability failures safely
- choose a recommendation
- write to shared memory

Implementation:

- `shopclaw/mastra/agents/domain.ts`

## 11. Test Strategy

The test suite is organized by subsystem:

- `launch-run.test.ts` covers Phase 1 behavior
- `orchestrator.test.ts` covers Phase 2 clarification gating
- `memory.test.ts` covers Phase 3 run-scoped memory rules
- `workflow.test.ts` covers Phase 4 step ordering
- `agents.test.ts` covers Phase 5 bounded agent outputs

The test runner is Node's built-in test runner with TypeScript strip mode.

Test command:

```bash
cd shopclaw
npm test
```

Optional coverage command:

```bash
cd shopclaw
node --test --experimental-strip-types --experimental-test-coverage test/*.test.ts
```

## 12. Documentation Plan

Maintained docs:

- `docs/0.TASK.md`
- `docs/1.SCOPE.md`
- `docs/2.PRD.md`
- `docs/3. TDD.md`
- `docs/PRDs/*`
- `docs/prd_impl.md`
- `docs/prd_implementation_phases.csv`
- `docs/phase-changelog.md`
- `docs/shopclaw-migration-plan.md`

Runtime docs:

- `shopclaw/README.md`

## 13. Remaining Phases

The remaining approved phases are not yet implemented:

- Phase 06: `PRD-008`, `PRD-009`
- Phase 07: `PRD-010`, `PRD-011`
- Phase 08: `PRD-012`
- Phase 09: `PRD-013`, `PRD-016`, `PRD-017`, `PRD-018`, `PRD-019`, `PRD-020`, `PRD-NFR-001`

Expected future work:

- add the India GTM agent
- add the Shopify agent with memory compounding
- add the Performance Ads agent
- add the SEO/GEO agent
- add the Launch Report agent
- add the delivery package artifacts
- enforce the demo runtime target

## 14. Risks and Gaps

Current gaps relative to the full task:

- only phases 1 through 5 are implemented
- the `shopclaw/` code structure exists, but the remaining agents and tools are still missing
- the final launch bible and delivery packaging are not yet implemented
- the demo artifact is not yet present
- the runtime time budget is not yet formally enforced

Current technical risks:

- the in-memory store is deterministic but not a full Mem0 backend
- the current agent outputs are stubbed and bounded, not production-integrated
- the workflow implementation currently covers only the early DAG segment

## 15. Execution Notes

When working in this repository:

1. Keep documentation changes in `docs/`
2. Keep runnable code in `shopclaw/`
3. Add or update tests whenever behavior changes
4. Keep each phase change traceable to the approved PRDs and FRDs
5. Avoid changing requirements or widening scope unless a later approved phase requires it

## 16. Recommended Next Step

Implement Phase 06 inside `shopclaw/`:

- GTM agent
- Shopify agent
- tests for memory compounding and prerequisite handling

That phase should continue to respect the existing separation between docs and code.
