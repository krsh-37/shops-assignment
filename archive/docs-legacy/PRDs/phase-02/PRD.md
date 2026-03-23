# Phase 02 PRD

Approved scope boundary: `PRD-002`, `PRD-021`.

## 1. Problem Summary
The orchestrator must pause for clarification before expensive work starts. This phase ensures the system asks required questions up front rather than pushing uncertainty downstream.

## 2. In-Scope Items
- Collect clarification questions before agent execution.
- Pause the workflow when required answers are missing.
- Prevent downstream work from starting before clarification is available.
- Publish run status so the operator can see the paused state and later progress updates.
- Keep previously completed work visible when later agents fail.

## 3. Out-of-Scope Items
- Agent-specific output generation.
- Memory compounding beyond clarification state.
- Final reporting.

## 4. Assumptions
1. Clarification questions are derived from the launch input.
2. The pause state is represented in run status.
3. The orchestrator owns the question timing.

## 5. Constraints and Risks
- Questions must be batched to avoid repeated interruptions.
- The pause state must be visible to the operator.

## 6. Open Questions
- None.

## 7. Success Criteria
- Missing launch inputs trigger a pause.
- No expensive agent begins before required answers exist.
- The workflow status reflects the pause state.
- Status updates remain visible as the run progresses.
