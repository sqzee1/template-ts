import Signal from "@rbxts/lemon-signal";
import { RunService } from "@rbxts/services";
import { PARAGON_API_KEY, PARAGON_ENABLED_IN_STUDIO } from "server/constants/paragon";

export type ParagonEventType = "join" | "leave" | "platform" | "heartbeat" | "server_close" | "funnel" | "purchase" | "economy" | "custom" | "error";

export type ParagonEvent = { readonly type: ParagonEventType; t?: number } & Record<string, unknown>;

/** Todo evento de telemetria passa por aqui; `ParagonService` é o único consumidor (fila + envio HTTP). */
export const paragonEvent = new Signal<(event: ParagonEvent) => void>();

/** Recibo de developer product aprovado; `ParagonPurchaseService` resolve nome/preço e gera o evento de compra. */
export const paragonReceipt = new Signal<(receipt: ReceiptInfo) => void>();

/** Telemetria ativa: precisa de chave e, no Studio, de PARAGON_ENABLED_IN_STUDIO. */
export function isParagonEnabled(): boolean {
  return PARAGON_API_KEY !== "" && (!RunService.IsStudio() || PARAGON_ENABLED_IN_STUDIO);
}

const sessions = new Map<number, string>();

export function getParagonSession(userId: number): string | undefined {
  return sessions.get(userId);
}

export function setParagonSession(userId: number, sessionId: string): void {
  sessions.set(userId, sessionId);
}

export function removeParagonSession(userId: number): void {
  sessions.delete(userId);
}

export function getParagonSessions(): string[] {
  const ids: string[] = [];
  for (const [, sessionId] of sessions) ids.push(sessionId);
  return ids;
}

export function getParagonSessionUsers(): number[] {
  const userIds: number[] = [];
  for (const [userId] of sessions) userIds.push(userId);
  return userIds;
}

// ---------- API pública: qualquer sistema do server chama estas funções ----------

/** Marca uma etapa de funil (tutorial, loja, rebirth...). Etapas numeradas em ordem a partir de 1; cada etapa conta uma vez por jogador. */
export function trackFunnel(player: Player, funnel: string, step: number, stepName?: string): void {
  paragonEvent.Fire({ type: "funnel", userId: player.UserId, sessionId: getParagonSession(player.UserId), funnel, step, stepName });
}

/** Fluxo de moeda do jogo: `amount` positivo = ganho (source), negativo = gasto (sink). */
export function trackEconomy(player: Player, currency: string, amount: number, transactionType: string, itemSku?: string): void {
  paragonEvent.Fire({
    type: "economy",
    userId: player.UserId,
    sessionId: getParagonSession(player.UserId),
    name: currency,
    value: amount,
    data: { transactionType, itemSku },
  });
}

/** Evento livre (BossKilled, PetHatched, Rebirth...). */
export function trackEvent(player: Player | undefined, name: string, value?: number, data?: Record<string, unknown>): void {
  const userId = player?.UserId;
  paragonEvent.Fire({ type: "custom", userId, sessionId: userId !== undefined ? getParagonSession(userId) : undefined, name, value, data });
}

/** Erro do jogo (DataStore falhou, estado inválido...). Aparece na aba Engajamento. */
export function trackError(name: string, data?: Record<string, unknown>): void {
  paragonEvent.Fire({ type: "error", name, data });
}

/** Chamar dentro do `ProcessReceipt` do jogo, depois de entregar o produto e antes de retornar `PurchaseGranted`. */
export function trackReceipt(receipt: ReceiptInfo): void {
  paragonReceipt.Fire(receipt);
}
