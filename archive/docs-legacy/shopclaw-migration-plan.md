# ShopClaw Migration Plan

This document records the intended code/doc separation and the target folder structure for the codebase.

## Goal

Move all runnable code out of the repository root into `shopclaw/` so documentation stays in `docs/` and implementation stays in the code folder.

## Target Structure

```text
shops-assignment/
  docs/
    ...
    shopclaw-migration-plan.md
  shopclaw/
    package.json
    README.md
    mastra/
      agents/
        orchestrator.ts
        research.ts
        visual.ts
        domain.ts
      memory/
        mem0.ts
      tools/
        launch-run.ts
      workflows/
        openclaw.ts
    test/
      *.test.ts
```

## Migration Steps

1. Create the `shopclaw/` code root.
2. Move the current runtime modules into the `mastra/` folders above.
3. Move the test suite under `shopclaw/test/`.
4. Move the package manifest and runtime README into `shopclaw/`.
5. Remove the old root-level code files so the repository root only contains docs and non-code support files.

## Current Status

- Plan written
- Code migration complete
- Docs remain in `shops-assignment/docs/`

## Notes

- The docs folder is intentionally kept separate from the runnable code.
- The code layout should continue to reflect the approved phase work, but under the new `shopclaw/` root.
