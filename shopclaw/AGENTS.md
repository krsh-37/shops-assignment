# AGENTS.md

This document gives repository-specific guidance for coding agents working on OpenClaw.

## Project Overview

OpenClaw is a Mastra-based multi-agent launch workflow for the ShopOS assignment.

The system is not just "chat plus tools". It has:

- a durable launch run registry in `.openclaw/runs.json`
- per-agent output files in `.openclaw/agent-run/<launchId>/`
- a control plane for start, resume, visual selection, and status
- a two-stage workflow split into pre-visual and post-visual execution
- shared launch memory that later steps read directly
- Mem0 conversation-style traces for external memory and observability

## Commands

Use these commands most often.

### CLI Demo

```bash
npm run cli
```

### Mastra Studio / API

```bash
npm run dev
```

### Typecheck

```bash
npm run typecheck
```

### Tests

```bash
npm test
```

### Live Integration Checks

```bash
npm run test:cli-live
npm run test:workflow-live
```

## Modes

### `OPENCLAW_MODE=staging`

- deterministic local builders
- stubbed providers
- best for repeatable local tests

### `OPENCLAW_MODE=dev`

- real provider-backed research and domain execution
- model-driven GTM, Shopify, Ads, SEO, and report generation
- staging-only builder tools are blocked

## Project Structure

Folders organize the launch engine by role.

| Folder                 | Description                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/cli.ts`           | Interactive terminal flow for the assignment demo                                                                                         |
| `src/mastra/agents`    | Orchestrator plus specialist agents                                                                                                       |
| `src/mastra/api`       | HTTP routes                                                                                                                               |
| `src/mastra/memory`    | Durable run registry and Mem0-backed memory layer                                                                                         |
| `src/mastra/services`  | Launch control services                                                                                                                   |
| `src/mastra/tools`     | Control tools and staging helper tools                                                                                                    |
| `src/mastra/workflows` | Pre-visual and post-visual workflows                                                                                                      |
| `src/mastra/domain`    | Schemas, normalization, and deterministic staging builders                                                                                |
| `src/mastra/providers` | Tavily, RDAP, Mem0, and related adapters                                                                                                  |
| `src/mastra/utils`     | Runtime logging helpers                                                                                                                   |

## Architecture Notes

- The authoritative control state for a launch is the local run record.
- Exact step inputs come from launch memory; Mem0 stores conversation-style summaries of inputs, rationale, and outputs.
- The workflow no longer does pre-step semantic Mem0 recall.
- In Studio/API flows, the chat thread is bound to the launch so follow-up actions can omit `launchId`.
- The CLI is the most reliable end-to-end demo path because it keeps one active session and waits for the next checkpoint.

## Working Rules

- Prefer the CLI path when verifying real launch behavior.
- Before debugging a bad step output, inspect the corresponding `.openclaw/agent-run/<launchId>/<agent>.json` file.
- When debugging control-flow issues, inspect both `.openclaw/runs.json` and the normalized `/status` output.
- Runtime logs are intentionally verbose and now show writes, memory-input dependencies, agent completions, and artifact paths.

For user-facing setup and architecture, see [README.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/README.md) and [DESIGN.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/DESIGN.md).
