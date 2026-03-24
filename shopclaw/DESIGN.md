# Design

## Phase 01

The current design goal is to establish the safe launch entrypoint before any specialist agents execute.

- `shopclaw/` is the runnable code root
- the orchestrator validates and normalizes the founder prompt
- clarification questions are batched from required launch inputs
- run state is persisted locally for resume and inspection
- downstream work remains blocked until clarification is complete
