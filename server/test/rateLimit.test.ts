import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "../rateLimit";

test("allows up to max per window, then limits with the full window as Retry-After", () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 60_000, max: 2, now: () => now });
  assert.equal(limiter.check("a").limited, false);
  assert.equal(limiter.check("a").limited, false);
  const third = limiter.check("a");
  assert.equal(third.limited, true);
  assert.equal(third.retryAfterSeconds, 60);
});
test("tracks clients independently and recovers after the window", () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 1_000, max: 1, now: () => now });
  assert.equal(limiter.check("a").limited, false);
  assert.equal(limiter.check("b").limited, false);
  assert.equal(limiter.check("a").limited, true);
  now = 1_001;
  assert.equal(limiter.check("a").limited, false);
});
test("bounds memory by dropping expired then oldest clients", () => {
  let now = 0;
  const limiter = createRateLimiter({ windowMs: 1_000, max: 1, now: () => now, maxClients: 3 });
  for (const key of ["a", "b", "c"]) limiter.check(key);
  now = 2_000;
  limiter.check("d");
  assert.ok(limiter.size() <= 3);
  limiter.check("e"); limiter.check("f"); limiter.check("g");
  assert.ok(limiter.size() <= 3);
});
