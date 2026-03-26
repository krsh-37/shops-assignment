# CLAUDE.md

This file provides repo-specific guidance for Claude Code and similar agents working in this repository.

This is an OpenClaw launch-engine project built on Mastra. The important implementation details are:

- the CLI is the primary demo path
- launch state is persisted in `.openclaw/runs.json`
- per-agent outputs are written to `.openclaw/agent-run/<launchId>/`
- Shopify additionally renders Dawn-style files into `.openclaw/agent-run/<launchId>/shopify/`
- launch memory is authoritative for exact step inputs and orchestration
- Mem0 is used as a conversation-style external memory trace, not as the primary step-to-step retrieval path
- the report step normalizes generated output back against launch memory before strict launch-bible validation
- Studio/API control flow uses thread-to-launch binding
- the workflow is split into pre-visual and post-visual phases with a visual-selection checkpoint

Start with:

- [README.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/README.md) for setup and current architecture
- [DESIGN.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/DESIGN.md) for workflow and memory decisions
- [AGENTS.md](/Users/kay/Documents/shopos/shops-assignment/shopclaw/AGENTS.md) for repo-specific working rules
