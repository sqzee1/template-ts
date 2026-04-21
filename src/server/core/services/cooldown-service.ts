import { Service } from '@flamework/core';

@Service({})
export class CooldownService {
  private cooldowns = new Map<string, number>();

  private getKey(player: Player, action: string): string {
    return `${player.UserId}:${action}`;
  }

  public onCooldown(player: Player, action: string, duration: number): boolean {
    const key = this.getKey(player, action);
    const now = os.clock();
    const lastUsed = this.cooldowns.get(key) ?? 0;

    if (now - lastUsed <= duration) return true;

    this.cooldowns.set(key, now);
    return false;
  }
}
