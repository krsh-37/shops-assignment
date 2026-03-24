# OpenClaw Task Plan

This document is the implementation plan derived directly from `docs/0.TASK.md`.

It is the source-of-truth plan for future implementation work.

## 1. Goal

Build the OpenClaw brand-launch engine as a runnable Mastra-based TypeScript service that:

- accepts one founder prompt
- asks clarification questions before expensive work starts
- uses shared memory across agents
- executes independent steps in parallel
- produces bounded outputs for each specialist agent
- compiles a final launch bible
- ships with a clear README, design document, and demo artifact

## 2. Source Of Truth

Primary source:

- [`docs/0.TASK.md`](./0.TASK.md)

Supporting references:

- Archived legacy docs:
  - [`archive/docs-legacy/1.SCOPE.md`](../archive/docs-legacy/1.SCOPE.md)
  - [`archive/docs-legacy/2.PRD.md`](../archive/docs-legacy/2.PRD.md)
  - [`archive/docs-legacy/3. TDD.md`](../archive/docs-legacy/3.%20TDD.md)

The legacy phase docs under `archive/docs-legacy/PRDs/` are useful reference material, but this task plan should drive the next implementation pass.

## 3. Target Stack

The task explicitly calls for:

- Mastra as the orchestration framework
- TypeScript throughout
- Zod for tool schema validation
- Node.js 20+ runtime
- Mem0 or a compatible local memory store
- CLI or HTTP interface
- pnpm workspaces preferred
- stubbed external integrations where needed

## 4. Required Scaffold

The task expects a Mastra repository structure along these lines:

```text
shopclaw/
  package.json
  README.md
  mastra/
    agents/
    tools/
    memory/
    workflows/
  test/
  docs/
```

Required file areas:

- `mastra/agents/`
- `mastra/tools/`
- `mastra/memory/mem0.ts`
- `mastra/workflows/openclaw.ts`
- `README.md`
- design document
- demo artifact

## 5. Implementation Rules

- Start from `npx create-mastra@latest`
- Use `createTool()` for every external integration
- Wire agents into a workflow with sequential and parallel steps
- Run Research and Domain in parallel
- Block Visual until Research completes
- Block Shopify until Visual and GTM complete
- Keep the implementation modular and phase-driven
- Keep docs separated from code

## 6. Folder Structure Plan

### Docs

```text
docs/
  0.TASK.md
  task-plan.md
  task-prds/
```

### Code

```text
shopclaw/
  mastra/
    agents/
    tools/
    memory/
    workflows/
  test/
```

## 7. Agent And Tool Plan

### Agents

- Orchestrator
- Research
- Visual
- Domain
- India GTM
- Shopify
- Performance Ads
- SEO/GEO
- Launch Report

### Tools

- Mem0 read/write
- web search
- page fetch
- logo generation stub
- domain availability check
- any other stubbed external integration required by later phases

## 8. Data And Memory Plan

The shared memory schema should hold:

- `idea`
- `research`
- `visual`
- `domains`
- `gtm`
- `shopify`
- `ads`
- `seo`
- `audit_log`

Memory rules:

- every read/write is run-scoped
- shared data must not bleed across runs
- agents should read previous outputs before writing their own
- Shopify must use visual palette and research keywords
- Ads must reuse brand context from memory

## 9. Workflow Plan

The required workflow shape is:

1. Orchestrator accepts the founder prompt
2. Clarification questions are asked before expensive work
3. Research and Domain run in parallel
4. Visual waits for Research
5. GTM waits for Research, Domain, and Visual
6. Shopify waits for Visual and GTM
7. Ads waits for prior brand context
8. SEO/GEO waits for research and visual context
9. Launch Report compiles the final bible

## 10. Delivery Plan

Required delivery artifacts:

- runnable TypeScript/Mastra codebase
- typed tools
- README
- design document
- demo artifact
- stubbed external integrations

## 11. Phased Implementation Plan

The implementation should be split into the following phases:

1. scaffold and repository foundation
2. orchestrator and clarification gating
3. shared memory layer
4. workflow DAG and dependency blocking
5. research, visual, and domain agents
6. India GTM and Shopify agents
7. Performance Ads and SEO/GEO agents
8. launch report synthesis
9. delivery packaging and demo artifact

The phase-specific PRD docs live in `docs/task-prds/`.

## 12. What To Do With The Current Implementation

The current prototype has been archived at `archive/shopclaw-prototype/shopclaw/`.

Treat the archived code as reference material while the task-based phase plan is implemented.

## 13. Next Step

Implement Phase 00 from the new task PRDs:

- scaffold the Mastra project
- lock the folder structure
- set up the tool and workflow skeleton
- keep the requirements traceable to the task doc

The legacy requirement docs and prototype implementation are now archived under `archive/`.
