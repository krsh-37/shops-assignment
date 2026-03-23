# Phase 05 PRD

Approved scope boundary: `PRD-115`, `PRD-116`.

## 1. Problem Summary
The system needs the India GTM and Shopify outputs that turn brand context into launch-ready execution assets.

## 2. In-Scope Items
- India GTM Agent writes a launch plan.
- Shopify Agent writes store assets from shared memory.
- Shopify must use visual palette and research keywords.
- GTM must use prior research, visual, and domain context.

## 3. Out-of-Scope Items
- Ads generation.
- SEO/GEO generation.
- Final launch bible synthesis.

## 4. Assumptions
1. GTM reads shared memory before acting.
2. Shopify compounding must use existing memory values, not fresh prompts.
3. Quick-commerce and channel strategy are part of the GTM brief.

## 5. Constraints and Risks
- Shopify must not regenerate brand context from scratch.
- Missing memory data must fail the step cleanly.

## 6. Open Questions
- None.

## 7. Success Criteria
- GTM produces city priority, channel split, reel ideas, influencer brief, and checklist.
- Shopify produces store assets that clearly derive from memory.

# Phase 05 FRD

## 1. System Behaviors
1. **FRD-115** The system shall generate one India market launch plan when the required prior context exists. If research, visual, or domain context is missing, the GTM step shall fail.
2. **FRD-116** The system shall generate one store asset package using the visual palette and research keywords from shared memory. If either source is missing, the Shopify step shall fail.

## 2. Inputs and Outputs
- GTM input: research, visual, and domain context.
- Shopify input: visual palette and research keywords.
- Output: GTM plan and Shopify asset package.

## 3. Validation Rules
- GTM shall include the approved launch-plan fields.
- Shopify shall use the memory-derived palette and keywords.

## 4. Error Handling
- Missing prior context shall fail the GTM step.
- Missing memory data shall fail the Shopify step.

## 5. External Dependencies
- Run-scoped memory from Phase 02.
- Workflow dependency checks from Phase 03.
