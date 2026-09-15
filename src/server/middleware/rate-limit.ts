import { Players } from "@rbxts/services";
import { type ClientMiddleware, DropRequest } from "@rbxts/tether";
import type { Message } from "shared/messaging";

export interface RateLimitPolicy {
  /** Maximum number of messages a player may send within `window` seconds. */
  readonly limit: number;
  /** Length of the refill window, in seconds. */
  readonly window: number;
  /** Consecutive violations tolerated before the player is kicked. Omit or set to 0 to never kick. */
  readonly kickAfter?: number;
}

export type RateLimitExceeded = (player: Player, message: Message, violations: number, policy: RateLimitPolicy) => void;

interface Bucket {
  tokens: number;
  lastRefill: number;
  violations: number;
}

const bucketMaps: Map<Player, Bucket>[] = [];

Players.PlayerRemoving.Connect((player) => {
  for (const buckets of bucketMaps) buckets.delete(player);
});

export function rateLimit(policy: RateLimitPolicy, onExceeded?: RateLimitExceeded): ClientMiddleware {
  const buckets = new Map<Player, Bucket>();
  bucketMaps.push(buckets);

  const refillPerSecond = policy.limit / policy.window;

  return (player, ctx) => {
    if (!typeIs(player, "Instance")) return;

    const now = os.clock();
    let bucket = buckets.get(player);

    if (bucket === undefined) {
      bucket = { tokens: policy.limit, lastRefill: now, violations: 0 };
      buckets.set(player, bucket);
    }

    bucket.tokens = math.min(policy.limit, bucket.tokens + (now - bucket.lastRefill) * refillPerSecond);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      bucket.violations += 1;
      onExceeded?.(player, ctx.message as Message, bucket.violations, policy);
      return DropRequest;
    }

    bucket.tokens -= 1;
    bucket.violations = 0;
  };
}
