import { callMethodOnDependencies } from "@rbxts/flamework-meta-utils";
import { Message, MessageData, messaging } from "shared/messaging";

/** @metadata reflect identifier */
export function OnMessage<Kind extends Message & keyof MessageData>(message: Kind) {
  return (
    ctor: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: unknown, player: Player, data: MessageData[Kind]) => void>,
    // biome-ignore lint/complexity/noVoid: reflection requires this
  ) => void messaging.server.on(message, (player, data) => callMethodOnDependencies(ctor, descriptor, player, data));
}
