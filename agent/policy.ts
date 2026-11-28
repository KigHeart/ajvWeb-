import type { Ledger } from "./ledger";

/**
 * read: no side effects. write-internal: changes only this service's own data.
 * external: leaves the system (email, payments, third-party APIs); always needs
 * a named human approval recorded before it runs.
 */
export type ToolScope = "read" | "write-internal" | "external";

export interface ToolSpec<I, O> {
  name: string;
  scope: ToolScope;
  run(input: I): Promise<O>;
}

export interface Approval {
  approvedBy: string;
  /** What exactly was approved, e.g. a recipient and message digest. Recorded verbatim. */
  note: string;
}

export class ToolDeniedError extends Error {
  constructor(public readonly tool: string, public readonly reason: string) {
    super(`tool "${tool}" denied: ${reason}`);
  }
}

export interface PolicyOptions {
  ledger: Ledger;
  /** The agent's own name, recorded as the actor on every event. */
  agent: string;
  /** Scopes this agent may use at all. `external` is never granted by default. */
  allowedScopes: readonly ToolScope[];
}

export function createToolbox({ ledger, agent, allowedScopes }: PolicyOptions) {
  const tools = new Map<string, ToolSpec<never, unknown>>();

  return {
    register<I, O>(tool: ToolSpec<I, O>) {
      if (tools.has(tool.name)) throw new Error(`tool "${tool.name}" already registered`);
      tools.set(tool.name, tool as unknown as ToolSpec<never, unknown>);
    },
    async call<I, O>(runId: string, name: string, input: I, approval?: Approval): Promise<O> {
      const tool = tools.get(name) as ToolSpec<I, O> | undefined;
      const deny = (reason: string): never => {
        ledger.append(runId, "tool_denied", agent, { tool: name, reason });
        throw new ToolDeniedError(name, reason);
      };
      if (!tool) return deny("unknown tool");
      if (!allowedScopes.includes(tool.scope)) return deny(`scope "${tool.scope}" is not granted to ${agent}`);
      if (tool.scope === "external") {
        if (!approval || approval.approvedBy.trim() === "" || approval.note.trim() === "") {
          return deny("external tools need a named human approval");
        }
        ledger.append(runId, "approval_granted", approval.approvedBy, { tool: name, note: approval.note });
      }
      ledger.append(runId, "tool_allowed", agent, { tool: name, scope: tool.scope });
      return tool.run(input);
    },
  };
}
