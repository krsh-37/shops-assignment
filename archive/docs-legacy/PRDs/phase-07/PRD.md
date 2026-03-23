# Phase 07 PRD

Approved scope boundary: `PRD-010`, `PRD-011`.

## 1. Problem Summary
The system must create performance advertising and search optimization outputs that reuse existing memory. This phase turns brand context into acquisition-ready messaging and discoverability planning.

## 2. In-Scope Items
- Performance Ads Agent writes ad strategy output.
- SEO/GEO Agent writes search and GEO output.
- Ads uses shared memory and does not re-ask for the brand name.

## 3. Out-of-Scope Items
- Ad account activation.
- Live campaign launch.
- Final report synthesis.

## 4. Assumptions
1. Brand context is already stored in memory.
2. SEO/GEO output is written as a planning artifact.
3. Ads and SEO/GEO can use stubbed integrations.

## 5. Constraints and Risks
- The Ads Agent must not ask for information already in memory.
- SEO/GEO must distinguish classic search from AI-answer targeting.

## 6. Open Questions
- None.

## 7. Success Criteria
- Ads output includes Meta and Google structures plus pacing.
- SEO/GEO output includes keyword clusters and GEO-ready FAQs.
- Neither agent re-asks for the brand name.

