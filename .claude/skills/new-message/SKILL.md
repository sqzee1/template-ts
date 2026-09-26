---
name: new-message
description: Adiciona uma mensagem de rede tether (enum Message + payload em MessageData + policy de rate limit + handlers com @OnMessage/@OnClientMessage). Usar para qualquer comunicação client ↔ server.
argument-hint: <NomeDaMensagem> <client->server|server->client> [payload]
---

# Nova mensagem de rede

Alvo: `$ARGUMENTS`

Antes: se o objetivo é replicar dado do jogador para o client, **não** criar mensagem — o `charm-sync` já faz isso pelo profile.

## Passos

1. `src/shared/messaging.ts`
   - Adicionar ao final do `const enum Message` (não reordenar — o valor numérico é o id na rede).
   - Tipar em `MessageData`: `[Message.Nome]: Payload;` (`undefined` se sem payload). Payload pequeno e plano.
2. `src/server/middleware/policies.ts`
   - Entrada obrigatória (o tipo força).
   - client → server: `{ limit, window, kickAfter }` realista para a ação.
   - server → client: `undefined`.
3. Handler
   - Server recebe: método em service com `@OnMessage(Message.Nome)` (`server/decorators.ts`), assinatura `(player: Player, data: Payload): void`. **Validar** `data` antes de agir.
   - Client recebe: método em controller com `@OnClientMessage(Message.Nome)` (`client/decorators.ts`), assinatura `(data: Payload): void`. Normalmente só escreve num state.
4. Envio
   - Client → server: `messaging.server.emit(Message.Nome, data)`.
   - Server → client: `messaging.client.emit(player, Message.Nome, data)`.

## Regras

- Server nunca confia no payload: checar tipo, faixa, posse, distância, cooldown.
- Handler fino: valida e delega para método privado do mesmo sistema ou escreve em state.
- Sem `RemoteEvent` manual e sem `@flamework/networking` para mensagens novas — usar tether.

## Finalizar

`bun run check` e `bun run build`.
