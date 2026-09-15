import { Service } from "@flamework/core";
import { OnPlayerJoin, OnPlayerLeave } from "server/hook-managers/hooks";

@Service({})
export class LifecycleService implements OnPlayerJoin, OnPlayerLeave {
  public onPlayerLeave(player: Player): void {}

  public onPlayerJoin(player: Player): void {}
}
