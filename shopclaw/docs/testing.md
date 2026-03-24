# Testing

## Automated Tests

Run the full test suite:

```sh
npm test
```

What this covers:

- founder prompt validation
- prompt trimming
- run record creation
- paused state when clarification is missing
- ready state when clarification is complete
- resume behavior for partially answered runs
- basic scaffold schema validation

Relevant files:

- [`test/launch-run.test.ts`](../test/launch-run.test.ts)
- [`test/orchestrator.test.ts`](../test/orchestrator.test.ts)
- [`test/scaffold.test.ts`](../test/scaffold.test.ts)

## Manual Run Test

Start a new run with a founder prompt:

```sh
npm run phase1:run -- --prompt "Launch a premium tea brand for busy office workers"
```

Expected result:

- a new `runId`
- `status: "paused"`
- three clarification questions
- `.mastra/state/launch-runs.json` created or updated
- `.mastra/logs/phase-01.log` appended

Resume the paused run with answers:

```sh
npm run phase1:run -- --resume <run-id> --target-cities "Mumbai, Bengaluru" --price-point "INR 499" --channel-strategy "D2C first, quick-commerce second"
```

Expected result:

- same `runId`
- `status: "ready"`
- no pending questions
- `downstreamAgentsStarted: true`

Inspect logs:

```sh
npm run phase1:logs
```

Expected log sequence:

1. `initialized`
2. `paused`
3. `ready`

## State Inspection

Inspect the latest persisted state directly:

```sh
sed -n '1,220p' .mastra/state/launch-runs.json
```

You should see:

- `prompt`
- `status`
- `clarification`
- `pendingQuestions`
- `statusHistory`

## Failure Cases To Try

Empty prompt:

```sh
npm run phase1:run -- --prompt "   "
```

Expected result:

- command exits non-zero
- failure is logged
- no valid run record is created

Unknown run id on resume:

```sh
npm run phase1:run -- --resume missing-run-id --target-cities "Mumbai"
```

Expected result:

- command exits non-zero
- error states that the launch run was not found
