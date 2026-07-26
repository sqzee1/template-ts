import { SyncPayload } from "@rbxts/charm-sync";
import { MessageEmitter } from "@rbxts/tether";

export type ProfileSyncSignals = {
  Profile: () => PlayerTemplate;
};

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  SyncData,
}

export interface MessageData {
  [Message.SyncData]: SyncPayload<ProfileSyncSignals>[];
}
