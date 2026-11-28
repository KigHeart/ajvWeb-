import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { openLedger } from "./ledger";
import { anthropicProvider } from "./model";
import { createToolbox } from "./policy";
import { AGENT_NAME, runWorkflowMapper } from "./workflowMapper";

/**
 * Usage: tsx agent/cli.ts --org "Acme Ltd" --file workflow.txt [--out report.json]
 * Needs ANTHROPIC_API_KEY. Optional: AJENTIR_AGENT_MODEL, AJENTIR_LEDGER_PATH.
 * Run it on a host of its own; never inside the public web process.
 */
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const organisation = arg("org");
  const file = arg("file");
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!organisation || !file || !apiKey) {
    console.error('usage: ANTHROPIC_API_KEY=... tsx agent/cli.ts --org "Name" --file workflow.txt [--out report.json]');
    process.exit(2);
  }
  const ledger = openLedger(process.env.AJENTIR_LEDGER_PATH || path.resolve("agent-data", "ledger.sqlite"));
  const model = anthropicProvider({ apiKey, model: process.env.AJENTIR_AGENT_MODEL || "claude-sonnet-5-5" });
  const toolbox = createToolbox({ ledger, agent: AGENT_NAME, allowedScopes: ["read", "write-internal"] });
  toolbox.register({
    name: "writeReport",
    scope: "write-internal",
    async run(input: { to: string; body: string }) { fs.writeFileSync(input.to, input.body); },
  });

  try {
    const report = await runWorkflowMapper({ model, ledger }, { organisation, workflowDescription: fs.readFileSync(file, "utf8") });
    const body = JSON.stringify(report, null, 2);
    const out = arg("out");
    if (out) await toolbox.call(report.runId, "writeReport", { to: out, body });
    else console.log(body);
    const check = ledger.verify();
    console.error(`ledger ${check.ok ? "verified" : "BROKEN"}: ${check.events} events, head ${check.head}`);
    if (!check.ok) process.exitCode = 1;
  } finally {
    ledger.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
