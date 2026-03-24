# Phase 00 PRD

Approved scope boundary: `PRD-101`, `PRD-102`.

## 1. Problem Summary
The repository needs the correct Mastra scaffold, runtime stack, and folder structure before any agent logic is implemented. This phase creates the implementation foundation from the task doc.

## 2. In-Scope Items
- Initialize the project from `npx create-mastra@latest`.
- Set up TypeScript, Mastra, and Node.js 20+ runtime compatibility.
- Establish `shopclaw/` as the runnable code root.
- Create the required `mastra/` subfolders.
- Add README, design document, and demo-artifact placeholders.
- Prepare the repo for CLI or HTTP execution.

## 3. Out-of-Scope Items
- Orchestrator behavior.
- Memory schema enforcement.
- Agent logic.
- Workflow execution.

## 4. Assumptions
1. `pnpm` is the preferred package manager.
2. Zod is used for typed tool schemas.
3. Stubbed external integrations are acceptable in the scaffold.

## 5. Constraints and Risks
- If the scaffold is wrong, later phases become harder to integrate.
- The code root and docs root must remain separated.

## 6. Open Questions
- None.

## 7. Success Criteria
- The repository matches the required code folder structure.
- The runtime stack is documented.
- The scaffold can support later agent and workflow phases.

# Phase 00 FRD

## 1. System Behaviors
1. **FRD-101** The system shall provide a Mastra-based project scaffold initialized from the approved starter approach. If the scaffold is missing, later phases shall not start.
2. **FRD-102** The system shall organize runnable code under `shopclaw/` with `mastra/`, `test/`, and supporting runtime files. If the structure is incomplete, the implementation shall be treated as uninitialized.

## 2. Inputs and Outputs
- Input: repository source tree and toolchain configuration.
- Output: runnable scaffold and documented folder structure.

## 3. Validation Rules
- The scaffold shall target TypeScript, Mastra, Zod, and Node.js 20+.
- The code root shall be separate from the docs root.

## 4. Error Handling
- Missing scaffold files shall fail setup validation.
- Missing runtime documentation shall fail delivery validation.

## 5. External Dependencies
- Mastra starter scaffold.
- pnpm workspace support.
