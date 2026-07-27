import { Getter, Setter, signal } from "@rbxts/charm";

type ProfileSignal = LuaTuple<[Getter<PlayerTemplate>, Setter<PlayerTemplate>]>;

export const template: PlayerTemplate = {
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
