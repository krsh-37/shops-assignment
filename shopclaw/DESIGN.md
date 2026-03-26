# OpenClaw Design

## System Shape

OpenClaw is split into two layers:

- control plane: launch creation, clarification resume, visual selection, status retrieval
- execution plane: the actual specialist-agent workflow over launch memory plus Mem0-backed conversation traces

The important implementation detail is that control state stays in the local run registry, while exact step inputs are assembled from launch memory and mirrored into Mem0 as conversation-style memory entries.

## Workflow DAG

```text
Founder
  |
  v
Orchestrator
  |
  +--> upfront clarification batch
  |
  v
Idea written to shared memory
  |
  +--> Research Agent ----+
  |                       |
  +--> Domain Agent ------+--> Visual Agent --> visual selection gate
                                                   |
                                                   v
                                               India GTM
                                                   |
                               +-------------------+-------------------+
                               |                                       |
                               v                                       v
                          Shopify Agent                          Ads Agent
                               |                                       |
                               +-------------------+-------------------+
                                                   |
                                                   v
                                              SEO / GEO
                                                   |
                                                   v
                                           Launch Report Agent
```

The workflow is currently implemented as two workflows plus two user-facing checkpoints:

- pre-visual workflow
- visual-selection gate
- post-visual workflow

## Clarification Timing

The implementation uses two user-facing checkpoints.

1. Upfront clarification batch of 5 high-signal questions before expensive work starts.
2. Visual concept selection after the visual package is generated.

This is a pragmatic compromise against the assignment spec. The spec lists many agent-specific clarification prompts, but the highest-value requirement is to ask clarifying questions before expensive work and preserve state across the rest of the workflow. The current design keeps one high-signal batch up front and one visual approval checkpoint, which is enough to demonstrate workflow suspension, user resumption, and memory-aware continuation.

## Run State And Memory

Each launch has a durable run record in `.openclaw/runs.json`.

The run-level memory shape is:

- `idea`
- `brief`
- `research`
- `visual`
- `domains`
- `gtm`
- `shopify`
- `ads`
- `seo`
- `audit_log`

Important decisions:

- `brief` is stored separately from `idea` so human answers remain normalized and reusable across later steps.
- `domains` now persists both `candidates15` and `top5`, so the demo can show the full naming exploration and the ranked recommendation.
- `selectedVisualConcept` lives on the run object because it is control state, not business content; once selected, it is mirrored into `memory.visual.chosen_concept`.
- `audit_log` is append-only and captures agent, action, timestamp, and written keys.

### Local Run Memory vs Mem0

These are intentionally different:

- local run memory is for orchestration state
- launch memory is the deterministic source for exact step inputs
- Mem0 stores conversation-style summaries of what the founder asked, what the agent received, why the agent acted, and what it produced
- pre-step semantic recall is currently not used in the workflow path

Later steps consume only the sections they need. For example:

- GTM reads `research`, `visual`, `domains`, `brief`
- Shopify reads `research`, `visual`, `gtm`
- Ads reads `research`, `visual`, `gtm`
- SEO reads `research`, `visual`, `shopify`, `ads`, `brief`

This is why a run can still succeed even if Mem0 has not materialized retrievable memories yet: the workflow does not block on semantic retrieval for step-to-step continuity.

### Why Repeated Launches Do Not Recall Each Other

The current workflow is still effectively launch-isolated.

Even though Mem0 writes now use a more platform-aligned shape, the workflow no longer depends on pre-step Mem0 search and does not yet implement a stable founder-level memory identity for cross-launch reuse. That makes separate launches independent by design.

## Dependency Order

- Research and Domain run in parallel because both depend only on the founder idea and brief.
- Visual waits for both because it needs competitive whitespace and domain recommendation context.
- GTM waits for Visual because channel, city, and creator strategy should reflect brand tone and chosen identity.
- Shopify and Ads run in parallel after GTM because both depend on upstream visual plus market context.
- SEO/GEO waits for Shopify and Ads because it uses both storefront language and acquisition positioning.
- Launch Report runs last because it synthesizes all prior sections.

## Memory Compounding Enforcement

The strongest explicit compounding rule is in Shopify:

- Theme palette is sourced from `visual.palette`
- Font pairing is sourced from `visual.font_pairing`
- Product descriptions and tags use `research.keywords`

Other examples:

- Visual prompts incorporate domain recommendation and research whitespace
- GTM uses founder answers plus brand and pricing context
- SEO/GEO uses research keywords, GTM cities, Shopify context, and ads context

The runtime logger now also prints these memory dependencies at execution time so the dataflow is inspectable from the CLI.

The test suite asserts key compounding behaviors so the workflow is not just sequencing independent stubs.

## Orchestrator Strategy

The repo exposes an orchestrator-backed control path. Instead of letting HTTP routes call workflow internals directly, the routes and tools delegate to orchestration services that coordinate:

- launch start
- clarification answer submission
- visual selection
- normalized status retrieval

### Thread Binding

When the orchestrator is used through Studio or the HTTP API, the active conversation thread is bound to the launch. That allows follow-up control actions to omit `launchId` and still resolve correctly within the same chat thread.

The launch id remains the internal primary key. Thread binding is only a conversation UX layer.

## Dev vs Staging

### `staging`

- deterministic builders
- stubbed provider behavior
- best for repeatable tests

### `dev`

- bounded provider-backed research and domain resolution
- model-driven GTM, Shopify, Ads, SEO, and Report generation
- staging-only builder tools are blocked from the dev execution path

The current design deliberately keeps external integrations bounded to reduce tool loops and make CLI runs terminate predictably.

## Observability

Runtime logging now prints:

- Mem0 writes
- memory sections consumed by each downstream step
- normalized clarification answers
- agent completion payload summaries
- visual selection
- final launch completion
- artifact file paths for completed agent outputs under `.openclaw/agent-run/<launchId>/`

This is primarily to make the assignment demo and debugging path inspectable from the terminal.

## What I Would Build Next With One More Week

- Introduce a stable founder or project identity for Mem0 so repeated launches can share semantic recall.
- Add an env gate for verbose runtime logs so test output stays quieter by default.
- Move all user-facing control to a richer orchestrator turn loop with stronger natural-language intent parsing.
- Add more explicit agent-by-agent clarification prompts and targeted re-entry points.
- Persist and surface per-agent status cards with timestamps, duration, and artifact previews.
- Add a packaged demo script that runs the assignment prompt end to end and prints the live status panel plus final launch bible.
