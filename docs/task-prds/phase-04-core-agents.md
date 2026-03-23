# Phase 04 PRD

Approved scope boundary: `PRD-112`, `PRD-113`, `PRD-114`.

## 1. Problem Summary
The system needs the core Research, Visual, and Domain outputs that define the brand direction.

## 2. In-Scope Items
- Research Agent writes structured research output.
- Visual Agent writes exactly three logo concept directions.
- Domain Agent writes a ranked domain shortlist and recommendation.
- Each agent fails when required input is missing.

## 3. Out-of-Scope Items
- GTM planning.
- Shopify output generation.
- Ads and SEO output generation.

## 4. Assumptions
1. Research data is available before Visual runs.
2. Domain availability checks can be stubbed.
3. Visual outputs can reference research context only.

## 5. Constraints and Risks
- Each agent must remain bounded to one output type.
- Visual and Domain cannot infer unavailable prerequisites.

## 6. Open Questions
- None.

## 7. Success Criteria
- Research output contains competitors, market size, whitespace, keywords, and India insight.
- Visual output contains exactly three concepts.
- Domain output contains a top-five shortlist and a recommended option.

# Phase 04 FRD

## 1. System Behaviors
1. **FRD-112** The system shall generate a structured research report when the founder idea exists. If the founder idea is missing, the system shall fail the research step.
2. **FRD-113** The system shall generate exactly three visual concepts when research data exists. If research data is missing, the system shall not generate concepts.
3. **FRD-114** The system shall generate a ranked domain shortlist when domain checks are available. If availability checks fail, the system shall mark the affected domain as unavailable.

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
