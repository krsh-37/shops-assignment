# Phase 03 PRD

Approved scope boundary: `PRD-109`, `PRD-110`, `PRD-111`.

## 1. Problem Summary
The workflow must run independent work in parallel and preserve dependency order for downstream steps.

## 2. In-Scope Items
- Run Research and Domain in parallel.
- Block Visual until Research completes.
- Block Shopify until Visual and GTM complete.
- Keep pending steps pending when dependencies are missing.

## 3. Out-of-Scope Items
- Agent content generation.
- Final report synthesis.
- UI polish.

## 4. Assumptions
1. The workflow engine can represent parallel and sequential steps.
2. Step completion is written to run status.
3. A missing dependency blocks execution.

## 5. Constraints and Risks
- Incorrect dependency order would break later memory compounding.
- Parallel execution must not lose run state.

## 6. Open Questions
- None.

## 7. Success Criteria
- Research and Domain start in parallel.
- Visual does not start before Research.
- Shopify does not start before Visual and GTM.

# Phase 03 FRD

## 1. System Behaviors
1. **FRD-109** The system shall start Research and Domain without waiting on each other. If one step fails to start, the other step shall still proceed.
2. **FRD-110** The system shall block Visual until Research completes. If Research is incomplete, Visual shall remain pending.
3. **FRD-111** The system shall block Shopify until Visual and GTM complete. If either prerequisite is missing, Shopify shall remain pending.

## 2. Inputs and Outputs
- Input: run ID and workflow state.
- Output: step execution order, pending state, completion state.

## 3. Validation Rules
- Each dependent step shall check prerequisite completion before starting.
- Parallel steps shall not require each other’s completion.

## 4. Error Handling
- Missing workflow state shall fail the step scheduling operation.
- A failed prerequisite shall leave dependent steps pending.

## 5. External Dependencies
- Shared memory from Phase 02.
