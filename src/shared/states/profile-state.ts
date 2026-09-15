import { Getter, Setter, signal } from "@rbxts/charm";
import { DATA_VERSION } from "shared/data/migrations";

type ProfileSignal = LuaTuple<[Getter<PlayerTemplate>, Setter<PlayerTemplate>]>;

export const template: PlayerTemplate = {
  Version: DATA_VERSION,
  Coins: 100,
};

const signals = new Map<number, ProfileSignal>();

export function getProfileKey(userId: number): string {
  return `Profile-${userId}`;
}

export function getProfileSignal(userId: number): ProfileSignal {
  let entry = signals.get(userId);

  if (!entry) {
    entry = signal({ ...template });
    signals.set(userId, entry);
  }

  return entry;
}

export function removeProfileSignal(userId: number): void {
  signals.delete(userId);
}
