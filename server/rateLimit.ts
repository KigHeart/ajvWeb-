/** Fixed-window-per-client limiter, process-local. Resets on restart. */
export interface RateLimiterOptions {
  windowMs: number;
  max: number;
  now?: () => number;
  /** Upper bound on tracked clients; the oldest are dropped past it. */
  maxClients?: number;
}

export interface RateDecision {
  limited: boolean;
  /** Seconds a limited client should wait. Always the full window, never an under-estimate. */
  retryAfterSeconds: number;
}

export function createRateLimiter({ windowMs, max, now = Date.now, maxClients = 10_000 }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();
  const retryAfterSeconds = Math.ceil(windowMs / 1000);

  function prune(current: number) {
    for (const [key, stamps] of hits) {
      const live = stamps.filter((t) => current - t < windowMs);
      if (live.length === 0) hits.delete(key);
      else hits.set(key, live);
    }
    // Still full after expiry: drop the oldest clients to leave room for the one being added.
    for (const key of hits.keys()) {
      if (hits.size < maxClients) break;
      hits.delete(key);
    }
  }

  return {
    check(key: string): RateDecision {
      const current = now();
      if (hits.size >= maxClients && !hits.has(key)) prune(current);
      const live = (hits.get(key) ?? []).filter((t) => current - t < windowMs);
      if (live.length >= max) {
        hits.set(key, live);
        return { limited: true, retryAfterSeconds };
      }
      live.push(current);
      hits.set(key, live);
      return { limited: false, retryAfterSeconds };
    },
    size: () => hits.size,
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;
