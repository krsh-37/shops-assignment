# OpenClaw

OpenClaw is a Mastra-based multi-agent brand launch engine for the ShopOS assignment. A founder gives one brand idea, the orchestrator collects the upfront clarifications, and the workflow runs eight specialist agents over shared memory before producing a launch bible.

## Stack

- Mastra
- TypeScript
- Zod
- Mem0-compatible shared memory layer with local persistence fallback
- HTTP API plus Mastra Studio

## Project Layout

```text
src/mastra/
  agents/       specialist agents + orchestrator
  api/          HTTP routes
  config/       mode and env handling
  domain/       schemas and deterministic staging builders
  memory/       shared launch memory + agent memory
  providers/    Tavily, RDAP, Mem0 adapters
  services/     launch orchestration services
  tools/        Mastra tools for launch control and agent tasks
  workflows/    pre-visual, post-visual, and full OpenClaw workflows
test/           workflow, agent, and tool coverage
```

## Modes

`OPENCLAW_MODE=staging`

- Default mode
- Uses deterministic builders and stubbed provider behavior
- Best for the assignment demo and local test runs

`OPENCLAW_MODE=dev`

- Uses configured external providers and agent generation paths
- Requires all API keys below

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

Install dependencies and start Mastra:

```bash
npm install
npm run dev
```

Recommended interactive launch flow:

```bash
npm run cli
```

Or provide the idea inline:

```bash
npm run cli -- --idea "I want to sell custom socks delivered in 10 minutes like Zepto but for socks."
```

Typecheck:

```bash
npm run typecheck
```

Tests:

```bash
npm test
```

## Demo Flow

The expected founder prompt is:

```text
I want to sell custom socks delivered in 10 minutes like Zepto but for socks.
```

Recommended demo interface: the CLI.

Why:

- it keeps one active launch session in-process
- it auto-waits for the next checkpoint
- it prints live status updates while the workflow runs
- it avoids Studio chat/thread ambiguity during clarification and visual-selection steps

Recommended API flow:

1. `POST /api/orchestrator/message` with `{ "message": "..." }`
2. Read the returned clarification batch and `launchId`
3. `POST /api/launch/:id/answers` with `{ "answers": [...] }`
4. Poll `GET /api/launch/:id/status` until phase becomes `visual-selection`
5. `POST /api/launch/:id/visual-selection` with `{ "conceptIndex": 0 }`
6. Poll `GET /api/launch/:id/status` until status becomes `completed`
7. `GET /api/launch/:id` to inspect the full memory and final launch bible

Recommended CLI flow:

1. Run `npm run cli`
2. Enter the founder idea
3. Answer the clarification batch
4. Review the three logo concept URLs
5. Optionally open the URLs in a browser
6. Select a concept
7. Wait for the final launch bible to print in the terminal

## API

Launch creation:

```http
POST /api/launch
Content-Type: application/json

{ "idea": "I want to sell custom socks delivered in 10 minutes like Zepto but for socks." }
```

Orchestrator conversation entrypoint:

```http
POST /api/orchestrator/message
Content-Type: application/json

{ "message": "I want to sell custom socks delivered in 10 minutes like Zepto but for socks." }
```

Submit clarification answers:

```http
POST /api/launch/:id/answers
Content-Type: application/json

{ "answers": ["Bengaluru, Mumbai, Pune", "Rs 399 to Rs 799", "Playful, energetic, avoid neon green"] }
```

Select visual concept:

```http
POST /api/launch/:id/visual-selection
Content-Type: application/json

{ "conceptIndex": 0 }
```

Normalized status:

```http
GET /api/launch/:id/status
```

Full run object:

```http
GET /api/launch/:id
```

## What Is Implemented

- Orchestrator-backed launch control tools
- Upfront clarification batch before expensive work starts
- Shared memory writes for idea, brief, research, visual, domains, GTM, Shopify, ads, SEO, and final report
- Explicit visual-selection pause before GTM, Shopify, ads, SEO, and reporting continue
- Domain shortlist persistence for 15 candidates plus ranked top 5
- Launch status normalization for phase-driven polling
- Deterministic CLI that auto-polls status and opens concept URLs on demand
- GTM city normalization that keeps founder-selected cities first
- Assignment-focused tests covering workflow, agents, and memory compounding

## Deliverables

- Assignment README: this file
- Design document: [DESIGN.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/DESIGN.md)

## Notes

- The shared run store persists to `.openclaw/runs.json`
- In `staging` mode the system is deterministic and test-friendly
- Shopify compounding is enforced from `mem0.visual.palette` and `mem0.research.keywords`
