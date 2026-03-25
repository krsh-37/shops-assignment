# Phase 1: Foundation And Workflow Skeleton

## Goal

Create the production-grade foundation for OpenClaw so every later phase can ship on a stable contract: typed schemas, shared memory, run state tracking, workflow DAG, agent/tool registration, and Phase 1 E2E verification.

## Scope

- Define TypeScript and Zod contracts for launch input, memory, run state, and final output.
- Replace the starter weather example with OpenClaw-specific Mastra modules.
- Create a shared memory layer compatible with the PRD Mem0 contract.
- Register all eight agents and the OpenClaw workflow in Mastra.
- Add launch services that can start, monitor, and complete a run.
- Add initial `/launch` and `/launch/:id` HTTP routes.
- Add Phase 1 E2E tests for orchestration, memory writes, and status transitions.

## Actionable Tasks

1. Create canonical schemas for:
   - Idea memory
   - Research memory
   - Visual memory
   - Domain memory
   - GTM memory
   - Shopify memory
   - Ads memory
   - SEO memory
   - Audit log
   - Launch bible
2. Build a launch store that supports:
   - `createRun`
   - `read`
   - `write`
   - `appendAuditLog`
   - `updateStatus`
   - `completeRun`
   - `failRun`
3. Implement deterministic stubs for every phase output so the workflow can run without external API keys.
4. Define all eight Mastra agents with role-appropriate instructions and tool attachments.
5. Implement the workflow DAG from the PRD:
   - Orchestrator
   - Parallel: Research + Domain
   - Visual
   - GTM
   - Parallel: Shopify + Ads
   - SEO
   - Launch Report
6. Add launch services for:
   - synchronous E2E execution
   - asynchronous background launch execution
   - run status lookup
7. Add custom API routes:
   - `POST /launch`
   - `GET /launch/:id`
8. Add tests that prove:
   - all required memory sections are written
   - status advances across the workflow
   - Shopify output compounds visual and research memory
   - final launch bible is returned

## Exit Criteria

- `npm test` passes
- `npm run build` succeeds
- the workflow completes successfully for the PRD sample idea
- all required memory sections are populated
- the final report is generated from shared memory, not isolated per-step inputs
- phase code review is completed and findings are fixed

## Assumptions

- Clarification questions are generated and stored with default assumptions instead of blocking the automated run.
- Visual outputs use deterministic logo prompt payloads and placeholder URLs instead of a real image model.
- Domain checks use a ranking stub that mimics RDAP availability data.
