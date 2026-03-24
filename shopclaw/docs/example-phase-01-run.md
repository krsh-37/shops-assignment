# Example Phase 01 Run

## Start A New Run

Command:

```sh
npm run phase1:run -- --prompt "Launch a premium tea brand for busy office workers"
```

Typical outcome:

```json
{
  "result": {
    "status": "paused",
    "questions": [
      {
        "key": "targetCities",
        "question": "What cities in India should we prioritise first?"
      },
      {
        "key": "pricePoint",
        "question": "What's the price point you're targeting?"
      },
      {
        "key": "channelStrategy",
        "question": "Direct-to-consumer only, or open to quick-commerce channels?"
      }
    ]
  }
}
```

Interpretation:

- the prompt was valid
- the run record was created
- non-orchestrator work is blocked
- clarification is required before the run can continue

## Resume The Run

Command:

```sh
npm run phase1:run -- --resume <run-id> --target-cities "Mumbai, Bengaluru" --price-point "INR 499" --channel-strategy "D2C first, quick-commerce second"
```

Typical outcome:

```json
{
  "result": {
    "status": "ready",
    "questions": [],
    "run": {
      "downstreamAgentsStarted": true
    }
  }
}
```

Interpretation:

- the final missing answers were provided
- the run moved from `paused` to `ready`
- Phase 01 stops here, before specialist agents execute

## Example Log Output

Command:

```sh
npm run phase1:logs
```

Typical output:

```json
{"status":"initialized","message":"Launch run created from founder prompt."}
{"status":"paused","message":"Clarification is incomplete. Downstream agents remain blocked."}
{"status":"ready","message":"Clarification complete. Run is ready for downstream execution."}
{"status":"ready","message":"Phase 01 stops before non-orchestrator agents start."}
```

## Example State File

Path:

```text
.mastra/state/launch-runs.json
```

What to look for:

- the final `status`
- `clarification` values
- `pendingQuestions`
- the full `statusHistory` sequence
