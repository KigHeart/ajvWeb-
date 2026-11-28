import test from "node:test";
import assert from "node:assert/strict";
import { anthropicProvider, scriptedProvider } from "../model";

test("anthropic provider sends the documented request shape and joins text blocks", async () => {
  let seen: { url: string; init: RequestInit } | undefined;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    seen = { url, init };
    return new Response(JSON.stringify({ content: [{ type: "text", text: "{" }, { type: "tool_use" }, { type: "text", text: "}" }] }), { status: 200 });
  }) as unknown as typeof fetch;
  const p = anthropicProvider({ apiKey: "k", model: "m", fetchImpl });
  assert.equal(await p.complete({ system: "s", user: "u", maxTokens: 10 }), "{}");
  assert.equal(seen?.url, "https://api.anthropic.com/v1/messages");
  const headers = seen?.init.headers as Record<string, string>;
  assert.equal(headers["x-api-key"], "k");
  assert.equal(headers["anthropic-version"], "2023-06-01");
  assert.deepEqual(JSON.parse(String(seen?.init.body)), { model: "m", max_tokens: 10, system: "s", messages: [{ role: "user", content: "u" }] });
});
test("anthropic provider fails closed on HTTP errors, empty replies and a missing key", async () => {
  const fail = (async () => new Response("denied key=sk-secret", { status: 401 })) as unknown as typeof fetch;
  await assert.rejects(anthropicProvider({ apiKey: "k", model: "m", fetchImpl: fail }).complete({ system: "", user: "", maxTokens: 1 }), (e: Error) => e.message === "model request failed with HTTP 401");
  const empty = (async () => new Response(JSON.stringify({ content: [] }), { status: 200 })) as unknown as typeof fetch;
  await assert.rejects(anthropicProvider({ apiKey: "k", model: "m", fetchImpl: empty }).complete({ system: "", user: "", maxTokens: 1 }), /no text/);
  assert.throws(() => anthropicProvider({ apiKey: " ", model: "m" }), /API key/);
});
test("scripted provider replays in order then runs dry", async () => {
  const p = scriptedProvider(["a"]);
  assert.equal(await p.complete({ system: "", user: "x", maxTokens: 1 }), "a");
  await assert.rejects(p.complete({ system: "", user: "y", maxTokens: 1 }), /ran out/);
  assert.equal(p.requests.length, 2);
});
