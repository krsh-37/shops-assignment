# Phase 04 FRD

## 1. System Behaviors
1. **FRD-008** The system shall start Research and Domain without waiting on each other. If one step fails to start, the other step shall still proceed.
2. **FRD-014** The system shall block Visual until Research completes. If Research is incomplete, Visual shall remain pending.
3. **FRD-015** The system shall block Shopify until Visual and GTM complete. If either prerequisite is missing, Shopify shall remain pending.

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
- Shared memory from Phase 03.
