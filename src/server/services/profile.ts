import { OnStart, Service } from "@flamework/core";
import { Getter, Setter, subscribe } from "@rbxts/charm";
import { server } from "@rbxts/charm-sync";
import ProfileStore from "@rbxts/profile-store";
import { Players, RunService } from "@rbxts/services";
import { OnPlayerJoin, OnPlayerLeave } from "server/hook-managers/hooks";
import { getProfileSignal, removeProfileSignal, template } from "shared/states/profile-state";

type Profile = ProfileStore.Profile<PlayerTemplate>;

@Service({})
export class ProfileService implements OnPlayerJoin, OnPlayerLeave, OnStart {
  private profiles = new Map<Player, Profile>();
  private unsubscribes = new Map<Player, () => void>();

  private PlayerDataStore = RunService.IsStudio() ? ProfileStore.New("PlayerDataStore", template).Mock : ProfileStore.New("PlayerDataStore", template);

  private initializePlayerData(player: Player, profile: Profile): void {
    const [getData, setData] = getProfileSignal(player.UserId);

    setData({ ...profile.Data });

    const unsubscribe = subscribe(getData, (state) => {
      profile.Data = state;
    });

    this.unsubscribes.set(player, unsubscribe);
  }

  public getProfile(player: Player): Profile | undefined {
    return this.profiles.get(player);
  }

  public getGetter(player: Player): Getter<PlayerTemplate> {
    return getProfileSignal(player.UserId)[0];
  }

  public getSetter(player: Player): Setter<PlayerTemplate> {
    return getProfileSignal(player.UserId)[1];
  }

  private initProfile(player: Player): void {
    const profile = this.PlayerDataStore.StartSessionAsync(`Player_${player.UserId}`, {
      Cancel: () => {
        return player.Parent !== Players;
      },
    });

    if (!profile) {
      player.Kick("Failed to load data");
      return;
    }

    profile.OnSessionEnd.Connect(() => {
      this.cleanup(player);
      player.Kick("Session end");
    });

    if (player.Parent === Players) {
      this.profiles.set(player, profile);
      this.initializePlayerData(player, profile);
    } else {
      profile.EndSession();
    }
  }

  private cleanup(player: Player): void {
    this.unsubscribes.get(player)?.();
    this.unsubscribes.delete(player);
    this.profiles.delete(player);
    removeProfileSignal(player.UserId);
    server.removeClient(player);
  }

  private removeProfile(player: Player): void {
    const profile = this.profiles.get(player);
    if (!profile) return;

    profile.EndSession();
    this.cleanup(player);
  }

  onPlayerJoin(player: Player): void {
    this.initProfile(player);
  }

  onPlayerLeave(player: Player): void {
    this.removeProfile(player);
  }

  onStart(): void {
    game.BindToClose(() => {
      for (const player of Players.GetPlayers()) {
        task.spawn(() => {
          this.removeProfile(player);
        });
      }
    });
  }
}
