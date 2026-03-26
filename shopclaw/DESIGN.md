# OpenClaw Design

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

## Clarification Timing

The implementation uses two user-facing checkpoints.

1. Upfront clarification batch before expensive work starts.
2. Visual concept selection after the visual package is generated.

This is a pragmatic compromise against the assignment spec. The spec lists many agent-specific clarification prompts, but the highest-value requirement is to ask clarifying questions before expensive work and preserve state across the rest of the workflow. The current design keeps one high-signal batch up front and one visual approval checkpoint, which is enough to demonstrate workflow suspension, user resumption, and memory-aware continuation.

## Memory Schema Decisions

The run-level memory is persisted in a local Mem0-compatible store with this shape:

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

## Dependency Order

- Research and Domain run in parallel because both depend only on the founder idea and brief.
- Visual waits for both because it needs competitive whitespace and domain recommendation context.
- GTM waits for Visual because channel, city, and creator strategy should reflect brand tone and chosen identity.
- Shopify and Ads run in parallel after GTM because both depend on upstream visual plus market context.
- SEO/GEO waits for Shopify and Ads because it uses both storefront language and acquisition positioning.
- Launch Report runs last because it synthesizes all prior sections.

## Memory Compounding Enforcement

The strongest explicit compounding rule is in Shopify:

- Theme palette is sourced from `mem0.visual.palette`
- Font pairing is sourced from `mem0.visual.font_pairing`
- Product descriptions and tags use `mem0.research.keywords`

Other examples:

- Visual prompts incorporate domain recommendation and research whitespace
- GTM uses founder answers plus brand and pricing context
- SEO/GEO uses research keywords, GTM cities, Shopify context, and ads context

The test suite asserts key compounding behaviors so the workflow is not just sequencing independent stubs.

## Orchestrator Strategy

The repo now exposes an orchestrator-backed HTTP control path. Instead of letting HTTP routes call launch internals directly, the routes delegate to orchestration tools and orchestration services that coordinate:

- launch start
- clarification answer submission
- visual selection
- normalized status retrieval

This keeps the user conversation path closer to the assignment’s “one conversation” model even though the staging mode remains deterministic.

## What I Would Build Next With One More Week

- Move all user-facing control to a richer orchestrator turn loop with stronger natural-language intent parsing.
- Add more explicit agent-by-agent clarification prompts and targeted re-entry points.
- Persist and surface per-agent status cards with timestamps, duration, and artifact previews.
- Replace more deterministic staging builders with realistic structured tool use, especially for research and domain ranking.
- Add a packaged demo script that runs the assignment prompt end to end and prints the live status panel plus final launch bible.
