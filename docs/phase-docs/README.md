# OpenClaw Delivery Phases

This folder breaks the PRD into implementation phases that can be completed, reviewed, and tested independently.

## Phase Index

1. `phase-1-foundation.md`
   Build the typed contracts, shared launch memory, orchestration skeleton, and verification harness.
2. `phase-2-core-intelligence.md`
   Implement the orchestrator, research, domain, visual, and GTM logic with memory compounding.
3. `phase-3-execution-assets.md`
   Implement Shopify, ads, SEO, and launch report generation on top of prior memory outputs.
4. `phase-4-delivery-hardening.md`
   Expose the HTTP interface, add observability and failure handling, and close gaps with E2E validation.

## Working Assumptions

- External APIs are stubbed with realistic deterministic outputs because real production integrations are explicitly out of scope in the PRD.
- Mem0 is represented by a compatible in-memory/shared-store abstraction with the same read/write behavior.
- Human-in-the-loop clarification is modeled as batched questions plus explicit assumptions so the workflow remains fully runnable in local E2E tests.
