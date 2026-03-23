# Phase Changelog

This document tracks what changed between approved implementation phases.

## Phase 01

- Added founder prompt validation and normalization.
- Created the first run-scoped launch record.
- Added the in-memory launch run store.
- Added tests for valid input, blank input, malformed input, and persistence failure.

Files:

- `src/launch-run.ts`
- `test/launch-run.test.ts`

## Phase 02

- Added clarification gating in the orchestrator.
- Added batched clarification questions for missing inputs.
- Marked the run as `paused` when clarification is incomplete.
- Marked the run as `ready` when clarification is present and downstream work may begin.

Files:

- `src/orchestrator.ts`
- `src/launch-run.ts`
- `test/orchestrator.test.ts`

## Phase 03

- Added a run-scoped memory store with explicit run ID enforcement.
- Added schema validation for memory writes.
- Added cross-run access prevention for memory reads.
- Added missing-value and invalid-value error handling.

Files:

- `src/memory.ts`
- `test/memory.test.ts`

## Phase 04

- Added a dependency-aware workflow scheduler.
- Started Research and Domain in parallel.
- Blocked Visual until Research completed.
- Kept Shopify pending until Visual and GTM were available.

Files:

- `src/workflow.ts`
- `test/workflow.test.ts`

## Phase 05

- Added bounded Research, Visual, and Domain agent implementations.
- Research now writes a structured report.
- Visual now writes exactly three logo concepts from shared research.
- Domain now writes a ranked shortlist and preserves availability failures as unavailable entries.

Files:

- `src/agents.ts`
- `test/agents.test.ts`

## Notes

- Phase 06 and later phases are not implemented yet.
- This changelog should be updated after each new approved phase is completed.
