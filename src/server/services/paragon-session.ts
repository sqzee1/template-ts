import { type OnStart, Service } from "@flamework/core";
import { HttpService, LocalizationService, Players, PolicyService, Stats, Workspace } from "@rbxts/services";
import { PARAGON_HEARTBEAT_INTERVAL } from "server/constants/paragon";
import { OnMessage } from "server/decorators";
import type { OnPlayerJoin, OnPlayerLeave } from "server/hook-managers/hooks";
import { getParagonSession, getParagonSessions, getParagonSessionUsers, paragonEvent, removeParagonSession, setParagonSession } from "server/states/paragon-state";
import { PARAGON_PLATFORMS, type ParagonPlatform } from "shared/constants/paragon";
import type { OnPostSimulation } from "shared/hooks";
import { Message } from "shared/messaging";

/** Sessões de jogo para o Paragon: entrada (origem, país, idade da conta...), saída, plataforma e heartbeat. */
@Service({})
export class ParagonSessionService implements OnStart, OnPlayerJoin, OnPlayerLeave, OnPostSimulation {
  private readonly reportedPlatform = new Set<Player>();
  private heartbeatElapsed = 0;

  public onStart(): void {
    game.BindToClose(() => this.closeAll());
  }

  public onPlayerJoin(player: Player): void {
    const sessionId = HttpService.GenerateGUID(false);
    // Sessão registrada antes das chamadas que cedem, para eventos de funil/compra já saírem com ela.
    setParagonSession(player.UserId, sessionId);

    const joinData = player.GetJoinData();
    paragonEvent.Fire({
      type: "join",
      userId: player.UserId,
      username: player.Name,
      displayName: player.DisplayName,
      sessionId,
      accountAge: player.AccountAge,
      country: this.getCountry(player),
      locale: player.LocaleId,
      premium: player.MembershipType === Enum.MembershipType.Premium,
      ageGroup: this.getAgeGroup(player),
      launchData: joinData.LaunchData,
      referrerId: joinData.ReferredByPlayerId !== 0 ? joinData.ReferredByPlayerId : undefined,
      sourcePlaceId: joinData.SourcePlaceId,
      followUserId: player.FollowUserId !== 0 ? player.FollowUserId : undefined,
    });
  }

  public onPlayerLeave(player: Player): void {
    this.reportedPlatform.delete(player);
    this.endSession(player.UserId);
  }

  public onPostSimulation(dt: number): void {
    this.heartbeatElapsed += dt;
    if (this.heartbeatElapsed < PARAGON_HEARTBEAT_INTERVAL) return;

    this.heartbeatElapsed = 0;
    paragonEvent.Fire({
      type: "heartbeat",
      sessions: getParagonSessions(),
      players: Players.GetPlayers().size(),
      fps: math.floor(Workspace.GetRealPhysicsFPS()),
      mem: math.floor(Stats.GetTotalMemoryUsageMb()),
    });
  }

  @OnMessage(Message.ParagonDevice)
  private onDevice(player: Player, platform: ParagonPlatform): void {
    if (!typeIs(platform, "string") || !PARAGON_PLATFORMS.includes(platform)) return;
    if (this.reportedPlatform.has(player)) return;

    this.reportedPlatform.add(player);
    paragonEvent.Fire({ type: "platform", userId: player.UserId, sessionId: getParagonSession(player.UserId), platform });
  }

  private endSession(userId: number): void {
    const sessionId = getParagonSession(userId);
    if (sessionId === undefined) return;

    removeParagonSession(userId);
    paragonEvent.Fire({ type: "leave", userId, sessionId });
  }

  private closeAll(): void {
    for (const userId of getParagonSessionUsers()) this.endSession(userId);
    paragonEvent.Fire({ type: "server_close" });
  }

  private getCountry(player: Player): string | undefined {
    const [success, country] = pcall(() => LocalizationService.GetCountryRegionForPlayerAsync(player));
    return success ? country : undefined;
  }

  private getAgeGroup(player: Player): string | undefined {
    // O Roblox não expõe idade; anúncios bloqueados indicam conta menor de 13 anos (ou região restrita).
    const [success, policy] = pcall(() => PolicyService.GetPolicyInfoForPlayerAsync(player));
    if (!success) return undefined;

    return policy.AreAdsAllowed ? "13+" : "<13";
  }
}
