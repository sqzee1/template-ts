import { OnStart, Service } from "@flamework/core";
import { Getter, Setter, signal, subscribe } from "@rbxts/charm";
import { server } from "@rbxts/charm-sync";
import ProfileStore from "@rbxts/profile-store";
import { Players, RunService } from "@rbxts/services";
import { OnPlayerJoin, OnPlayerLeave } from "server/hook-managers/hooks";
import { Message, messaging, ProfileSyncSignals } from "shared/messaging";

type Profile = ProfileStore.Profile<PlayerTemplate>;

@Service({})
export class ProfileService implements OnPlayerJoin, OnPlayerLeave, OnStart {
  private template: PlayerTemplate = {
    Coins: 100,
  };

  private profiles = new Map<Player, Profile>();
  private getters = new Map<Player, Getter<PlayerTemplate>>();
  private setters = new Map<Player, Setter<PlayerTemplate>>();
  private unsubscribes = new Map<Player, () => void>();

  private PlayerDataStore = RunService.IsStudio() ? ProfileStore.New("PlayerDataStore", this.template).Mock : ProfileStore.New("PlayerDataStore", this.template);

  private initializePlayerData(player: Player, profile: Profile): void {
    const [getData, setData] = signal({ ...profile.Data });

    const unsubscribe = subscribe(getData, (state) => {
      profile.Data = state;
    });

    this.getters.set(player, getData);
    this.setters.set(player, setData);
    this.unsubscribes.set(player, unsubscribe);

    server.addSignalsToClient(player, { Profile: getData });
  }

  public getProfile(player: Player): Profile | undefined {
    return this.profiles.get(player);
  }

  public getGetter(player: Player): Getter<PlayerTemplate> | undefined {
    return this.getters.get(player);
  }

  public getSetter(player: Player): Setter<PlayerTemplate> | undefined {
    return this.setters.get(player);
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
    this.getters.delete(player);
    this.setters.delete(player);
    this.profiles.delete(player);
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
    server.connect<ProfileSyncSignals>((player, payloads) => {
      messaging.client.emit(player, Message.SyncData, payloads);
    });

    game.BindToClose(() => {
      for (const player of Players.GetPlayers()) {
        task.spawn(() => {
          this.removeProfile(player);
        });
      }
    });
  }
}
