export interface ModelRequest {
  system: string;
  user: string;
  maxTokens: number;
}

/** The only door to a language model. The agent service holds the credential; the public web process never does. */
export interface ModelProvider {
  id: string;
  complete(request: ModelRequest): Promise<string>;
}

export interface AnthropicOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function anthropicProvider({ apiKey, model, baseUrl = "https://api.anthropic.com", fetchImpl = fetch }: AnthropicOptions): ModelProvider {
  if (!apiKey.trim()) throw new Error("anthropicProvider needs an API key");
  return {
    id: `anthropic:${model}`,
    async complete({ system, user, maxTokens }) {
      const response = await fetchImpl(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
      });
      if (!response.ok) throw new Error(`model request failed with HTTP ${response.status}`);
      const body = (await response.json()) as { content?: { type: string; text?: string }[] };
      const text = (body.content ?? []).filter((b) => b.type === "text" && typeof b.text === "string").map((b) => b.text).join("");
      if (!text) throw new Error("model response contained no text");
      return text;
    },
  };
}

/** Deterministic provider for tests and offline development: replays canned replies in order. */
export function scriptedProvider(replies: string[]): ModelProvider & { requests: ModelRequest[] } {
  const requests: ModelRequest[] = [];
  return {
    id: "scripted",
    requests,
    async complete(request) {
      requests.push(request);
      const reply = replies[requests.length - 1];
      if (reply === undefined) throw new Error("scriptedProvider ran out of replies");
      return reply;
    },
  };
}
