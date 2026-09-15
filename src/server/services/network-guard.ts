import { type OnInit, Service } from "@flamework/core";
import { rateLimitPolicies } from "server/middleware/policies";
import { type RateLimitPolicy, rateLimit } from "server/middleware/rate-limit";
import type { Message } from "shared/messaging";
import { messaging } from "shared/messaging";

const KICK_REASON = "Kicked for sending too many requests.";

@Service({ loadOrder: -1 })
export class NetworkGuardService implements OnInit {
  public onInit(): void {
    for (const [message, policy] of pairs(rateLimitPolicies)) {
      if (policy === undefined) continue;

      messaging.middleware.useServerReceive(
        message,
        rateLimit(policy, (player, kind, violations) => this.onRateLimitExceeded(player, kind, violations, policy)),
      );
    }

    messaging.middleware.onRequestDropped((message, reason) => {
      warn(`[network-guard] dropped message ${message}: ${reason ?? "unknown reason"}`);
    });
  }

  private onRateLimitExceeded(player: Player, message: Message, violations: number, policy: RateLimitPolicy): void {
    warn(`[network-guard] ${player.Name} exceeded rate limit for message ${message} (${violations} consecutive)`);

    const kickAfter = policy.kickAfter;
    if (kickAfter !== undefined && kickAfter > 0 && violations >= kickAfter) player.Kick(KICK_REASON);
  }
}
