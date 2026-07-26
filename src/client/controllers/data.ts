import { Controller, OnStart } from "@flamework/core";
import { client } from "@rbxts/charm-sync";
import { getProfileData, setProfileData } from "client/utility/data-state";
import { Message, messaging } from "shared/messaging";

@Controller({})
export class DataController implements OnStart {
  public getData(): PlayerTemplate | undefined {
    return getProfileData();
  }

  onStart(): void {
    client.addSignals({ Profile: setProfileData });

    messaging.client.on(Message.SyncData, (payloads) => {
      client.patch(payloads);
    });
  }
}
