# Phase 06 PRD

Approved scope boundary: `PRD-117`, `PRD-118`.

## 1. Problem Summary
The system needs the performance ads and SEO/GEO outputs that extend the brand into acquisition and discoverability planning.

## 2. In-Scope Items
- Performance Ads Agent writes an ad strategy package.
- SEO/GEO Agent writes a search plan and FAQ content.
- Both agents must reuse shared memory context.
- Ads must not re-ask for the brand name.

## 3. Out-of-Scope Items
- Final report synthesis.
- Delivery packaging.
- Production ad account setup.

## 4. Assumptions
1. Ads and SEO/GEO read existing memory before acting.
2. External ad/search integrations can be stubbed.
3. Brand context is already present by this phase.

## 5. Constraints and Risks
- These agents must not start from a blank slate.
- Missing memory should fail the step rather than prompting again.

## 6. Open Questions
- None.

## 7. Success Criteria
- Ads produce a full strategy package from memory.
- SEO/GEO produce classic SEO and answer-ready FAQ content.

# Phase 06 FRD

## 1. System Behaviors
1. **FRD-117** The system shall generate one ad strategy package using shared memory for brand context. If brand context is missing, the system shall fail the ads step without asking for the brand name again.
2. **FRD-118** The system shall generate one search plan with classic SEO content and GEO-ready FAQ content. If keyword data is missing, the system shall fail the SEO/GEO step.

## 2. Inputs and Outputs
- Ads input: shared brand context.
- SEO/GEO input: research keywords and brand context.
- Output: ad strategy package and SEO/GEO search plan.

## 3. Validation Rules
- Ads shall read brand context from memory.
- SEO/GEO shall read research keywords from memory.

## 4. Error Handling
- Missing brand context shall fail the Ads step.
- Missing keyword data shall fail the SEO/GEO step.

## 5. External Dependencies
- Run-scoped memory from Phase 02.
