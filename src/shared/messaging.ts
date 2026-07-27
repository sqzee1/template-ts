import { SyncPayload } from "@rbxts/charm-sync";
import { MessageEmitter } from "@rbxts/tether";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  SyncData,
  Ready,
}

export interface MessageData {
  [Message.SyncData]: SyncPayload[];
  [Message.Ready]: undefined;
}
