import { Controller, OnStart } from "@flamework/core";
import { client } from "@rbxts/charm-sync";
import { Players } from "@rbxts/services";
import { setProfileData } from "client/utility/data-state";
import { Message, messaging } from "shared/messaging";
import { getProfileKey } from "shared/states/profile-state";

@Controller({ loadOrder: 999 })
export class EmitterController implements OnStart {
  onStart(): void {
    client.addSignals({
      [getProfileKey(Players.LocalPlayer.UserId)]: setProfileData,
    });

    messaging.client.on(Message.SyncData, (payloads) => {
      client.patch(payloads);
    });

    messaging.server.emit(Message.Ready);
  }
}
