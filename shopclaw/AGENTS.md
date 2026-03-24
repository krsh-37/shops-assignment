# AGENTS.md

Guidance for coding agents working in the `shopclaw` scaffold.

## Scope

This directory is the runnable code root required by Phase 00. Keep task docs outside this code root and keep implementation files under the local scaffold directories.

## Commands

```bash
npm run dev
npm run build
npm test
```

## Structure

| Path | Purpose |
| --- | --- |
| `mastra/index.ts` | Mastra entrypoint used by CLI commands via `--dir ./mastra` |
| `mastra/agents` | Agent stubs and future implementations |
| `mastra/tools` | Tool definitions created with `createTool()` |
| `mastra/memory` | Memory contracts and storage helpers |
| `mastra/workflows` | Workflow skeletons and orchestration |
| `docs` | Runtime notes and local implementation docs |
| `test` | Scaffold validation and later phase tests |

## Rules

- Preserve the `shopclaw/mastra` layout required by the task plan.
- Do not reintroduce the generated weather example.
- Prefer stubbed integrations until the later phases require real behavior.
- Keep runtime assumptions traceable to the phase docs.
