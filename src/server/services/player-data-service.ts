import { Service } from "@flamework/core";
import ProfileStore from "@rbxts/profile-store";
import { Players } from "@rbxts/services";

type Profile = ProfileStore.Profile<PlayerTemplate>;

@Service({})
export class PlayerDataService {
  private Template: PlayerTemplate = {
    Coins: 0,
  };

  private Profiles = new Map<Player, Profile>();
  private PlayerDataStore = ProfileStore.New("PlayerDataStore", this.Template);

  private initializePlayerData(player: Player, profile: Profile) {}

  private getProfile(player: Player): Profile | undefined {
    return this.Profiles.get(player);
  }

  public init(player: Player): void {
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
      this.Profiles.delete(player);
      player.Kick("Session end");
    });

    if (player.Parent === Players) {
      this.Profiles.set(player, profile);
      this.initializePlayerData(player, profile);
    } else {
      profile.EndSession();
    }
  }

  public remove(player: Player): void {
    const profile = this.Profiles.get(player);
    if (!profile) return;

    profile.EndSession();
    this.Profiles.delete(player);
  }
}
