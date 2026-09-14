import { Flamework, Modding } from "@flamework/core";
import { Constructor } from "@flamework/core/out/utility";
import { callMethodOnDependencies } from "@rbxts/flamework-meta-utils";
import { InputManager, RawInput } from "@rbxts/mechanism";
import { BaseStandardAction, StandardActionBuilder } from "@rbxts/mechanism/out/standard-action";
import { FlameworkIgnited } from "shared/constants/standard";
import { Message, MessageData, messaging } from "shared/messaging";

export const inputManager = new InputManager();

const rawInputArrayGuard = Flamework.createGuard<string[]>();
export const OnInput = Modding.createDecorator<[binding: RawInput | RawInput[] | BaseStandardAction]>("Method", (descriptor, [action]) => {
  FlameworkIgnited.Once(() => {
    const isArray = rawInputArrayGuard(action);
    const actualAction = typeIs(action, "string") || isArray ? (isArray ? new StandardActionBuilder(...action) : new StandardActionBuilder(action)) : action;

    inputManager.bind(actualAction);
    actualAction.activated.Connect(() => {
      const object = Modding.resolveSingleton(descriptor.constructor as Constructor<Record<string, Callback>>);

      object[descriptor.property](object, action);
    });
  });
});

export const OnInputDeactivated = Modding.createDecorator<[binding: RawInput | RawInput[] | BaseStandardAction]>("Method", (descriptor, [action]) => {
  FlameworkIgnited.Once(() => {
    const isArray = rawInputArrayGuard(action);
    const actualAction = typeIs(action, "string") || isArray ? (isArray ? new StandardActionBuilder(...action) : new StandardActionBuilder(action)) : action;

    inputManager.bind(actualAction);
    actualAction.deactivated.Connect(() => {
      const object = Modding.resolveSingleton(descriptor.constructor as Constructor<Record<string, Callback>>);

      object[descriptor.property](object, action);
    });
  });
});

export function OnClientMessage<Kind extends Message & keyof MessageData>(message: Kind) {
  return (
    ctor: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: unknown, data: MessageData[Kind]) => void>,
    // biome-ignore lint/complexity/noVoid: reflection requires this
  ) => void messaging.client.on(message, (data) => callMethodOnDependencies(ctor, descriptor, data));
}
