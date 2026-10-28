import { OnStart, Service } from "@flamework/core";
import Konsole from "@kyrorblx/konsole";
import { RunService } from "@rbxts/services";
import type { OnPlayerLeave } from "server/hook-managers/hooks";

const OWNER_RANK = 100;
const GROUP_ADMIN_RANK = 254;

@Service({})
export class KonsoleService implements OnStart, OnPlayerLeave {
  private readonly rankCache = new Map<Player, number | undefined>();

  onStart(): void {
    Konsole.bindRanks((entity) => this.resolveRank(entity));
    Konsole.host();
  }

  public onPlayerLeave(player: Player): void {
    this.rankCache.delete(player);
  }

  // Dono do jogo (ou cargo ≥ 254 no grupo dono) recebe rank 100; no Studio, todos.
  private resolveRank(entity: unknown): number | undefined {
    if (!typeIs(entity, "Instance") || !entity.IsA("Player")) return undefined;
    if (RunService.IsStudio()) return OWNER_RANK;
    if (this.rankCache.has(entity)) return this.rankCache.get(entity);

    const rank = this.isOwner(entity) ? OWNER_RANK : undefined;
    this.rankCache.set(entity, rank);
    return rank;
  }

  private isOwner(player: Player): boolean {
    if (game.CreatorType === Enum.CreatorType.User) return player.UserId === game.CreatorId;

    const [success, groupRank] = pcall(() => player.GetRankInGroup(game.CreatorId));
    return success && groupRank >= GROUP_ADMIN_RANK;
  }
}
