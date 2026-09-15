import type { RateLimitPolicy } from "server/middleware/rate-limit";
import { Message } from "shared/messaging";

export const rateLimitPolicies: { readonly [K in Message]: RateLimitPolicy | undefined } = {
  [Message.SyncData]: undefined,
  [Message.Ready]: { limit: 2, window: 10, kickAfter: 20 },
};
