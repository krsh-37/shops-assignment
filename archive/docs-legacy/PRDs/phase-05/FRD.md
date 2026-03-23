# Phase 05 FRD

## 1. System Behaviors
1. **FRD-011** The system shall generate a structured research report when the founder idea exists. If the founder idea is missing, the system shall fail the research step.
2. **FRD-012** The system shall generate exactly three visual concepts when research data exists. If research data is missing, the system shall not generate concepts.
3. **FRD-013** The system shall generate a ranked domain shortlist when domain checks are available. If availability checks fail, the system shall mark the affected domain as unavailable.

## 2. Inputs and Outputs
- Research input: founder idea and market context.
- Visual input: research output and brand direction.
- Domain input: brand name candidates and availability result.
- Output: structured agent payloads written to memory.

## 3. Validation Rules
- Research output shall include the approved fields.
- Visual output shall contain exactly three concepts.
- Domain output shall contain a ranked list and one recommendation.

## 4. Error Handling
- Missing research input shall fail the Visual step.
- Missing founder idea shall fail the Research step.
- Failed availability checks shall not block the entire workflow.

## 5. External Dependencies
- Search or stubbed market data for Research.
- Stubbed logo generation for Visual.
- RDAP or DNS stub for Domain.

