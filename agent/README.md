# Ajentir agent service

A separate, separately permissioned process. It is **not** part of the public web server (`server.ts`) and must not be imported by it: the web process holds no model credential and runs no agent. See "Existing limitations" in `SELF_HOSTED_DEPLOYMENT.md`.

## Design

- **Untrusted model output.** `workflowMap.ts` validates every reply against a strict schema. Failures are fed back once; after `maxAttempts` the run fails. Demand evidence is not in the schema: only a human can evidence willingness to pay.
- **Deterministic analysis.** `constraints.ts` computes the binding constraint, the next constraint it exposes, and automation that buys no throughput. The model supplies per-step estimates; code does the arithmetic. Assumption (CONJECTURE): a serial line, no queues or parallel branches.
- **Capability policy.** `policy.ts` grants scopes per agent. `external` tools (anything that leaves the system) need a named human approval, recorded before the tool runs.
- **Tamper-evident ledger.** `ledger.ts` is an append-only, hash-chained SQLite log. It stores digests of prompts and replies, not client text. It is tamper-evident, not tamper-proof: anchor the head hash somewhere the writer cannot reach.

## Run

```sh
ANTHROPIC_API_KEY=... npx tsx agent/cli.ts --org "Acme Ltd" --file workflow.txt --out report.json
npm run test:agent
```

`AJENTIR_AGENT_MODEL` (default `claude-sonnet-5-5`) and `AJENTIR_LEDGER_PATH` (default `agent-data/ledger.sqlite`) are optional.

## Not yet verified

The Anthropic provider is tested against a fake `fetch` for the documented request shape. It has not been run against the live API from this repository's CI.
