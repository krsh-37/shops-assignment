# Phase 04 PRD

Approved scope boundary: `PRD-004`, `PRD-014`, `PRD-015`.

## 1. Problem Summary
The workflow must run independent work in parallel and preserve dependency order for downstream steps. This phase establishes the execution structure that later agents rely on.

## 2. In-Scope Items
- Run Research and Domain in parallel.
- Block Visual until Research completes.
- Block Shopify until Visual and GTM complete.

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
