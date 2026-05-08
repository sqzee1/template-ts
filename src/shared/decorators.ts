import { Atom, subscribe } from "@rbxts/charm";
import { callMethodOnDependencies } from "@rbxts/flamework-meta-utils";

export function UseAtom<T>(atom: Atom<T>) {
  return (
    ctor: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(this: unknown, state: T, prev: T) => void>,
  ) => {
    subscribe(atom, (state, prev) => callMethodOnDependencies(ctor, descriptor, state, prev));
  };
}
