# OpenClaw

OpenClaw is the ShopOS assignment implementation: a Mastra-based launch engine that takes one founder idea, asks one upfront clarification batch, runs a shared-memory workflow, pauses for visual selection, and then finishes the launch package.

The repo now has two distinct interaction paths:

- `npm run cli`: primary demo interface and the most reliable path
- Mastra Studio / HTTP API: useful for debugging and inspecting runs

## Current Architecture

### Control Plane

- The founder starts a launch with an idea.
- A launch run is created and stored in `.openclaw/runs.json`.
- The orchestrator collects one upfront batch of 5 clarification answers before expensive work starts.
- The pre-visual workflow runs and pauses at the visual-selection checkpoint.
- The founder selects one of the 3 visual concepts.
- The post-visual workflow runs to completion and produces the final launch bible.

### Workflow DAG

```text
Founder
  |
  v
Orchestrator
  |
  +--> clarification gate
  |
  v
Pre-visual workflow
  |
  +--> Research ----+
  |                 |
  +--> Domain ------+--> Visual --> visual-selection gate
                                         |
                                         v
Post-visual workflow                     GTM
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
                    Shopify                              Ads
                       |                                   |
                       +-----------------+-----------------+
                                         |
                                         v
                                      SEO / GEO
                                         |
                                         v
                                   Launch Report
```

### Memory Model

There are two memory layers:

1. Launch memory
   This is the control-state layer. It is persisted locally in `.openclaw/runs.json` and is used for orchestration concerns like phase, status, pending questions, selected concept, audit log, and final report tracking.

2. Shared business memory
   Business sections such as `idea`, `brief`, `research`, `visual`, `domains`, `gtm`, `shopify`, `ads`, and `seo` are written to the launch memory and also summarized into Mem0 as conversation-style traces. The workflow uses exact launch memory for deterministic step inputs and uses Mem0 as the external memory layer for searchable context, auditability, and future cross-run reuse.

Important consequence:

- repeated separate launches still do not meaningfully recall each other yet, because the current setup isolates runs tightly and the workflow no longer does pre-step Mem0 semantic recall
- within one launch, exact agent-to-agent handoff comes from launch memory, while Mem0 stores a cleaner external trace of what each agent saw, why it acted, and what it produced

### Thread Binding

When the orchestrator is used through Studio or the HTTP API, the active chat thread is bound to the current launch. That allows:

- clarification resume without making the user provide `launchId`
- visual-selection resume without making the user provide `launchId`
- status lookup from the same thread

This binding is for conversation control. The internal primary key is still `launchId`.

## Project Layout

```text
src/
  cli.ts                interactive terminal demo flow
  mastra/
    agents/             orchestrator + specialist agents
    api/                HTTP routes
    config/             mode and env handling
    domain/             schemas, normalization, staging builders
    memory/             run store and Mem0-backed shared memory
    providers/          Tavily, RDAP, Mem0 adapters
    services/           launch control and orchestration services
    tools/              control tools + staging-only helper tools
    utils/              runtime logging helpers
    workflows/          pre-visual and post-visual workflows
test/                   unit, workflow, and live integration tests
.openclaw/runs.json     durable local run registry
.openclaw/agent-run/    per-agent output snapshots by launch id
```

## Modes

### `OPENCLAW_MODE=staging`

- Default mode
- Deterministic and test-friendly
- Uses local builders and stubbed provider behavior
- Best for repeatable local tests

### `OPENCLAW_MODE=dev`

- Uses real provider-backed execution where implemented
- Research uses bounded Tavily/page-fetch evidence gathering plus one synthesis pass
- Domain uses bounded real availability checks with timeout/fallback behavior
- GTM, Shopify, Ads, SEO, and Launch Report are model-driven in `dev`
- Staging-only builder tools are intentionally blocked in `dev`

## Environment

Required in `dev` mode:

```bash
OPENCLAW_MODE=dev
GOOGLE_GENERATIVE_AI_API_KEY=...
TAVILY_API_KEY=...
MEM0_API_KEY=...
MEM0_ORG_ID=...
MEM0_PROJECT_ID=...
```

Optional in `staging` mode:

```bash
OPENCLAW_MODE=staging
```

## Run

Install dependencies:

```bash
npm install
```

Start Mastra Studio / API:

```bash
npm run dev
```

Run the CLI:

```bash
npm run cli
```

Run the CLI with an inline founder idea:

```bash
npm run cli -- --idea "I want to start a restaurant"
```

Typecheck:

```bash
npm run typecheck
```

Tests:

```bash
npm test
```

Live integration checks:

```bash
npm run test:cli-live
npm run test:workflow-live
```

## Recommended Demo Path

Use the CLI.

Why:

- it keeps one active launch session in-process
- it waits for the next checkpoint instead of making the user poll manually
- it prints status as the workflow advances
- it prints where each completed agent wrote its output artifact on disk
- it handles clarification and visual-selection as structured terminal prompts
- it avoids Studio thread ambiguity during the assignment demo

Typical CLI flow:

1. Enter the founder idea
2. Answer the 5 clarification questions
3. Wait for the visual-selection checkpoint
4. Review the 3 concept URLs
5. Optionally open them in a browser
6. Choose one concept
7. Read the final launch summary in the terminal

## API

### Start a launch

```http
POST /api/launch
Content-Type: application/json

{ "idea": "I want to start a restaurant" }
```

### Orchestrator conversation entrypoint

```http
POST /api/orchestrator/message
Content-Type: application/json

{ "message": "I want to start a restaurant" }
```

### Submit clarification answers

```http
POST /api/launch/:id/answers
Content-Type: application/json

{ "answers": ["Chennai", "Rs 300 to Rs 500", "D2C"] }
```

### Select a visual concept

```http
POST /api/launch/:id/visual-selection
Content-Type: application/json

{ "conceptIndex": 1 }
```

### Get normalized status

```http
GET /api/launch/:id/status
```

The normalized status includes:

- `launchId`
- `status`
- `phase`
- `current_agent`
- `completed_agents`
- `pending_reason`
- `pending_questions`
- `next_action`
- `visual_concepts`
- `selected_visual_concept`
- `report_summary`
- `error`

### Get the full run object

```http
GET /api/launch/:id
```

## Runtime Logging

The runtime logger now prints:

- Mem0 recalls
- Mem0 writes
- normalized clarification answers
- memory sections passed into each downstream agent step
- agent completions
- visual selection
- final launch completion

This is primarily for CLI/dev observability. The logs are intentionally verbose.

## What Is Implemented

- Orchestrator-backed launch control
- Upfront clarification gate
- Visual-selection gate
- Durable local run store
- Thread-to-launch binding for Studio/API control flow
- Launch status normalization
- Shared memory compounding across workflow steps
- Domain persistence for `candidates15`, `top5`, and `recommended`
- CLI-first demo path
- Live and deterministic test coverage

## Deliverables

- Assignment README: this file
- Design document: [DESIGN.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/DESIGN.md)

## Notes

- `.openclaw/runs.json` is the durable local run registry for control state
- Mem0 is the shared business-memory path between agents
- repeated fresh launches do not currently share semantic memory because Mem0 is scoped by `launchId`
- `staging` is for deterministic local runs, `dev` is for provider-backed execution
