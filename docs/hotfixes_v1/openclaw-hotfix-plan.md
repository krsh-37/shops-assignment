# OpenClaw Hotfix Plan V1

## Purpose

This document defines the first hotfix wave needed to bring OpenClaw closer to the intended architecture in [0.TASK.md](/Users/kay/Documents/shopos/shops-assignment/docs/0.TASK.md) and [PRD.md](/Users/kay/Documents/shopos/shops-assignment/docs/PRD.md).

The current codebase is functional as a staged workflow demo, but it is not yet aligned with the intended model of:

- one conversation through the Orchestrator
- shared Mem0-backed compounding memory
- eight well-scoped agents with clear tool contracts
- human-in-the-loop clarification and resume points
- deliverable-grade outputs, not only structured JSON

## Hotfix Scope

This hotfix wave focuses on correctness and architecture, not polish.

### In scope

- orchestrator and workflow integration
- human-in-the-loop clarification flow
- workflow failure handling
- durable run state
- Mem0 shared-memory contract
- agent/tool boundary cleanup
- staging vs dev mode separation
- minimum repo/documentation cleanup

### Out of scope

- UI design work
- production deployment hardening
- advanced asset generation quality
- scale optimization beyond the current single-run correctness bar

## Current Gap Summary

### Gap 1: Orchestrator is not the real control plane

The task requires the Orchestrator to be the only user-facing conversation agent and to coordinate the workflow. Today, the real execution center is the workflow, while the Orchestrator is mostly a chat router.

### Gap 2: HITL clarification flow is missing

Clarification questions are generated and written to memory, but the workflow does not pause, collect answers, or resume. Visual concept selection is also not user-driven.

### Gap 3: `startLaunch()` can fail silently

The async launch path does not consistently mark workflow failures when `run.start()` returns a non-success result without throwing.

### Gap 4: Run state is not durable

Launch state is managed in local process memory. That is fragile for restart, polling, and multi-worker behavior.

### Gap 5: Mem0 is only partially the shared memory layer

Mem0 cloud is integrated for search/add, but the operational run model is still partly local and not the single source of truth.

### Gap 6: Tool coverage is incomplete

The task expects typed tools per agent boundary. Currently, research/domain have real tools, but several agents remain prompt wrappers or deterministic staging builders.

### Gap 7: Workflow and agent boundaries are thinner than required

Several agent responsibilities are only represented as structured generation, not tool-driven or artifact-producing execution units.

### Gap 8: Deliverable outputs are under-specified

Shopify output is not yet a real package/patch set. Report output is not yet an artifact bundle.

### Gap 9: Staging fallback contracts are brittle

The staging path is useful, but some contracts are still shaped around a sock example and can break on generic ideas.

### Gap 10: Repo polish is below deliverable bar

README and package metadata still reflect scaffold defaults rather than a finished assignment repo.

## Target Architecture

The intended operating model after this hotfix wave:

1. User talks only to Orchestrator.
2. Orchestrator batches clarification questions before expensive work starts.
3. Orchestrator starts or resumes the workflow explicitly.
4. Workflow suspends at defined human checkpoints.
5. Every agent reads shared memory before acting and writes structured output after acting.
6. Staging uses stub tools and deterministic outputs only.
7. Dev uses live LLMs and live providers.
8. Launch state is durable and pollable across process restarts.

## Workstreams

## Workstream 1: Rebuild Orchestrator Ownership

### Goal

Make the Orchestrator the real user-facing control plane again without reintroducing auto-start behavior.

### Changes

- Reattach `openclawWorkflow` to the Orchestrator in `dev`.
- Keep workflow invocation explicit, not automatic.
- Add an explicit orchestration contract:
  - collect founder idea
  - ask clarification batch
  - confirm assumptions
  - start workflow only after confirmation
- In `staging`, keep the workflow visible for testing but prevent agent-led auto execution.

### Files

- `shopclaw/src/mastra/agents/orchestrator-agent.ts`
- `shopclaw/src/mastra/index.ts`

### Acceptance criteria

- Orchestrator can list and invoke the workflow in `dev`.
- Orchestrator does not auto-run the workflow on startup.
- Studio startup no longer triggers runs without user action.

## Workstream 2: Implement Human-in-the-Loop Clarification and Resume

### Goal

Implement the missing clarification and concept-choice loop required by the task.

### Changes

- Add explicit suspend/resume points in the workflow.
- Pause after initial clarification generation.
- Resume only after user answers are collected.
- Pause again for visual concept selection.
- Support targeted re-run of visual generation if user rejects all concepts.

### Files

- `shopclaw/src/mastra/workflows/openclaw.ts`
- `shopclaw/src/mastra/services/openclaw-launch-service.ts`
- `shopclaw/src/mastra/api/openclaw-routes.ts`
- `shopclaw/src/mastra/domain/openclaw/schemas.ts`

### Acceptance criteria

- Workflow suspends after clarification questions.
- Workflow can be resumed with user answers.
- Visual concept choice is stored and used downstream.
- The user can correct or rerun visual without restarting the entire launch.

## Workstream 3: Fix Launch Failure Semantics

### Goal

Ensure failed async runs always transition into a failed state and surface a useful error.

### Changes

- Make `startLaunch()` inspect `run.start()` result status.
- Mark runs failed when status is not `success`.
- Normalize error handling across sync and async launch paths.

### Files

- `shopclaw/src/mastra/services/openclaw-launch-service.ts`

### Acceptance criteria

- No run remains incorrectly queued/running after workflow failure.
- Polling API reflects failure deterministically.

## Workstream 4: Make Run State Durable

### Goal

Replace process-local launch state with durable persisted run state.

### Changes

- Move launch-run registry out of the in-memory `Map`.
- Persist launch metadata and current status in SQLite or another local durable store.
- Rehydrate runs on restart.
- Keep Mem0 as shared semantic memory, but stop using local process memory as the authoritative launch state.

### Files

- `shopclaw/src/mastra/memory/mem0.ts`
- `shopclaw/src/mastra/index.ts`
- `shopclaw/src/mastra/services/openclaw-launch-service.ts`

### Acceptance criteria

- `GET /launch/:id` works after process restart.
- Run status survives watch reload and restart.
- Multi-run isolation remains correct.

## Workstream 5: Tighten Mem0 as Shared Agent Memory

### Goal

Align the memory model with the task’s shared-memory contract.

### Changes

- Define what is stored in Mem0 cloud vs local durable store.
- Ensure every agent performs:
  - read from Mem0 before acting
  - write structured output after acting
- Add explicit helper methods for:
  - read memory by section
  - write memory by section
  - append audit log

### Files

- `shopclaw/src/mastra/memory/mem0.ts`
- `shopclaw/src/mastra/providers/mem0-client.ts`

### Acceptance criteria

- Every agent has a documented Mem0 read/write contract.
- Shopify and Ads demonstrate clear memory compounding from upstream outputs.

## Workstream 6: Bring Agent/Tool Design Closer to Task Spec

### Goal

Make each agent reflect a defined scope and tool contract.

### Changes

- Add missing tools where task expects them:
  - `askUser`
  - `readMem0`
  - `writeMem0`
  - `fetchPage`
  - visual generation stub/provider tool
  - artifact packaging helpers
- Reattach tools to agents where appropriate.
- Keep staging deterministic, but keep tool boundaries real.

### Files

- `shopclaw/src/mastra/tools/*`
- `shopclaw/src/mastra/agents/*`

### Acceptance criteria

- Each agent has a clear tool surface or a justified reason not to.
- No tool does two unrelated jobs.
- All tool schemas remain Zod-typed.

## Workstream 7: Upgrade Output Contracts

### Goal

Move from “memory objects” to “usable deliverables”.

### Changes

- Expand Shopify output to artifact-level files:
  - `theme-settings.json`
  - `products.json`
  - `homepage-sections.json`
  - `collections.json`
- Expand SEO/GEO output from string arrays to page objects with titles, slugs, bodies, and metadata.
- Expand final report to include artifact references and package metadata.

### Files

- `shopclaw/src/mastra/domain/openclaw/schemas.ts`
- `shopclaw/src/mastra/domain/openclaw/content.ts`
- `shopclaw/src/mastra/tools/*`

### Acceptance criteria

- Shopify output is patchable/package-shaped.
- SEO/GEO output contains page-grade content objects.
- Final report references all generated artifacts coherently.

## Workstream 8: Fix Staging Robustness

### Goal

Make staging contract-safe even when using deterministic stubs.

### Changes

- Ensure generic ideas produce 5 brand candidates.
- Ensure domain shortlist always satisfies schema contracts.
- Strengthen deterministic builders so they are not sock-specific.

### Files

- `shopclaw/src/mastra/domain/openclaw/content.ts`
- `shopclaw/test/openclaw.e2e.test.ts`

### Acceptance criteria

- Non-sock staging runs pass.
- Staging outputs conform to all downstream schemas.

## Workstream 9: Test Expansion

### Goal

Move beyond happy-path validation.

### Changes

- Add tests for:
  - workflow failure path
  - non-sock idea path
  - clarification suspend/resume path
  - visual choice path
  - persistence across restart
  - API route behavior

### Files

- `shopclaw/test/openclaw.e2e.test.ts`
- new test files as needed

### Acceptance criteria

- Happy-path is no longer the only tested behavior.
- At least one restart/persistence scenario is covered.
- At least one failure scenario is covered.

## Workstream 10: Repo and Deliverable Cleanup

### Goal

Bring the repo closer to the required assignment handoff.

### Changes

- Rename package from `mastra-test`.
- Rewrite README for OpenClaw setup and mode behavior.
- Add env documentation for `staging` and `dev`.
- Add a short design note for workflow DAG and memory compounding.

### Files

- `shopclaw/package.json`
- `shopclaw/README.md`
- `docs/*`

### Acceptance criteria

- README can bootstrap a new reviewer in under 10 minutes.
- Repo metadata matches the project identity.

## Recommended Execution Order

1. Workstream 3: fix failure semantics
2. Workstream 2: implement clarification + resume
3. Workstream 4: make run state durable
4. Workstream 1: restore orchestrator ownership in `dev`
5. Workstream 5: tighten Mem0 contracts
6. Workstream 6: expand tool surfaces
7. Workstream 7: upgrade output contracts
8. Workstream 8: fix staging robustness
9. Workstream 9: expand tests
10. Workstream 10: repo cleanup

## Exit Criteria for Hotfix V1

Hotfix V1 is complete only when all of the following are true:

- Orchestrator owns workflow start/resume in `dev`
- clarification flow suspends and resumes correctly
- visual concept selection is human-controlled
- async run failures are surfaced reliably
- `/launch/:id` is durable across restart
- staging remains fully stubbed
- dev remains provider-backed
- all tools remain Zod-typed
- tests cover at least one failure path and one resume path
- README and package metadata no longer look scaffolded

## Notes

- Staging is intentionally allowed to use deterministic builders.
- Dev must remain the real-provider path.
- Auto-start behavior must remain disabled even after the workflow is reattached to the Orchestrator.
