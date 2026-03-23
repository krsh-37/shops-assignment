# Phase 01 PRD

Approved scope boundary: `PRD-103`, `PRD-104`.

## 1. Problem Summary
The system needs a safe entry point that accepts one founder prompt, normalizes it, and pauses for clarification before any non-orchestrator agent starts.

## 2. In-Scope Items
- Accept one founder prompt.
- Validate the prompt as a non-empty string.
- Create one run-scoped launch record.
- Ask clarification questions before downstream agent execution.
- Pause the workflow when required answers are missing.
- Publish run status for operator visibility.

## 3. Out-of-Scope Items
- Shared memory schema beyond the launch record.
- Agent execution.
- Workflow DAG execution.

## 4. Assumptions
1. Clarification questions are derived from the launch input.
2. The run status can represent paused and ready states.
3. The orchestrator owns question timing.

## 5. Constraints and Risks
- Questions must be batched.
- The pause state must remain visible.
- No non-orchestrator agent should start while clarification is pending.

## 6. Open Questions
- None.

## 7. Success Criteria
- Valid prompts start a run and invalid prompts do not.
- Missing inputs trigger batched clarification questions.
- Downstream agents do not start until clarification is complete.

# Phase 01 FRD

## 1. System Behaviors
1. **FRD-103** The system shall accept one founder prompt and create one run-scoped launch record. If the prompt is empty or malformed, the run shall not start.
2. **FRD-104** The system shall collect clarification questions before any non-orchestrator agent starts. If answers are missing, the workflow shall pause and remain paused until clarification is complete.
3. **FRD-105** The system shall publish workflow status after each agent completes. If an agent fails, the failure shall remain visible without erasing prior completed work.

## 2. Inputs and Outputs
- Input: founder prompt and launch metadata.
- Output: run ID, normalized prompt, paused or ready status, and clarification questions.

## 3. Validation Rules
- The prompt shall be a string.
- The trimmed prompt shall not be empty.
- Required clarification inputs shall be checked before agent execution.

## 4. Error Handling
- Non-string input shall raise a validation error.
- Missing clarification data shall prevent non-orchestrator agent execution.

## 5. External Dependencies
- Run state storage from Phase 00.
