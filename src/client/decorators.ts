import { callMethodOnDependencies } from "@rbxts/flamework-meta-utils";
import { Message, MessageData, messaging } from "shared/messaging";

export function OnClientMessage<Kind extends Message & keyof MessageData>(message: Kind) {
  return (
    ctor: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: unknown, data: MessageData[Kind]) => void>,
    // biome-ignore lint/complexity/noVoid: reflection requires this
  ) => void messaging.client.on(message, (data) => callMethodOnDependencies(ctor, descriptor, data));
}
