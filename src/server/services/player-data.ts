import { Service } from "@flamework/core";
import { Update } from "@rbxts/charm";
import { ProfileService } from "server/services/profile";

@Service({})
export class PlayerDataService {
  constructor(private readonly profileService: ProfileService) {}

  public getData(player: Player): PlayerTemplate | undefined {
    return this.profileService.getGetter(player)?.();
  }

  public setData(player: Player, update: Update<PlayerTemplate>): void {
    this.profileService.getSetter(player)?.(update);
  }

  public addAmountToKey(player: Player, key: NumberKeys<PlayerTemplate>, amount: number): void {
    this.setData(player, (prev) => ({ ...prev, [key]: prev[key] + amount }));
  }

  public removeAmountFromKey(player: Player, key: NumberKeys<PlayerTemplate>, amount: number): void {
    this.setData(player, (prev) => ({ ...prev, [key]: prev[key] - amount }));
  }
}
