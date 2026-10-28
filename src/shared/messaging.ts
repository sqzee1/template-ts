import { SyncPayload } from "@rbxts/charm-sync";
import { MessageEmitter } from "@rbxts/tether";
import type { ParagonPlatform } from "shared/constants/paragon";

export const messaging = MessageEmitter.create<MessageData>();

export const enum Message {
  SyncData,
  Ready,
  ParagonDevice,
}

export interface MessageData {
  [Message.SyncData]: SyncPayload[];
  [Message.Ready]: undefined;
  [Message.ParagonDevice]: ParagonPlatform;
}
