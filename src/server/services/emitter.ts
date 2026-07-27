import { OnStart, Service } from "@flamework/core";
import { server } from "@rbxts/charm-sync";
import { Message, messaging } from "shared/messaging";
import { getProfileKey, getProfileSignal } from "shared/states/profile-state";

@Service({})
export class EmitterService implements OnStart {
  onStart(): void {
    server.connect((player, payloads) => {
      messaging.client.emit(player, Message.SyncData, payloads);
    });

    messaging.server.on(Message.Ready, (player) => {
      const [getProfileData] = getProfileSignal(player.UserId);

      server.addSignalsToClient(player, {
        [getProfileKey(player.UserId)]: getProfileData,
      });
    });
  }
}
