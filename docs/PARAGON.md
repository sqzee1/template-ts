# Paragon — telemetria do painel de analytics

Todo jogo do template já vem com a telemetria do painel **Paragon Studios Analytics** (sessões, retenção, origem/campanhas, público, plataforma, compras em tempo real, funis, economia, eventos e erros). Desligada até preencher a chave.

## Ativar num jogo

1. Painel → **Adicionar jogo** → aba **Integração** → copiar endpoint e chave.
2. `src/server/constants/paragon.ts`: preencher `PARAGON_ENDPOINT` e `PARAGON_API_KEY`.
3. Studio: **Game Settings → Security → Allow HTTP Requests = ON**.
4. Testar no Studio: `PARAGON_ENABLED_IN_STUDIO = true` (voltar para `false` antes de publicar).

## Peças

| Arquivo | Papel |
|---|---|
| `server/constants/paragon.ts` | Endpoint, chave, intervalos (server-only: a chave não replica) |
| `server/states/paragon-state.ts` | Signals `paragonEvent` / `paragonReceipt`, sessões ativas e a **API pública** (`trackFunnel`, `trackEconomy`, `trackEvent`, `trackError`, `trackReceipt`) |
| `server/services/paragon.ts` | `ParagonService` — fila, envio em lote a cada 15 s, compra enviada na hora, drenagem no `BindToClose` |
| `server/services/paragon-session.ts` | `ParagonSessionService` — join (origem, país, idade da conta, faixa etária estimada, Premium), leave, heartbeat, plataforma |
| `server/services/paragon-purchase.ts` | `ParagonPurchaseService` — game passes automáticos, developer products via `trackReceipt` |
| `client/controllers/paragon.ts` | `ParagonController` — detecta PC/Mobile/Tablet/Console/VR e envia `Message.ParagonDevice` |

Os sistemas não se injetam: tudo passa pelos signals de `paragon-state.ts` (regra 1 e 2 do `CLAUDE.md`).

## Usar nos sistemas do jogo (server)

```ts
import { trackEconomy, trackEvent, trackFunnel, trackReceipt } from "server/states/paragon-state";

trackFunnel(player, "tutorial", 1, "Spawned");          // etapas em ordem, a partir de 1
trackEconomy(player, "Coins", 100, "Quest");             // + ganho
trackEconomy(player, "Coins", -50, "Shop", "Sword");     // - gasto
trackEvent(player, "BossKilled", 1, { boss: "Dragon" });

// Dentro do ProcessReceipt, depois de entregar o produto:
trackReceipt(receipt);
return Enum.ProductPurchaseDecision.PurchaseGranted;
```

Regras de funil: nome estável (`tutorial`, `shop`, `rebirth`), etapas contíguas começando em 1, nunca renumerar depois de publicado (mudou o fluxo → `tutorial_v2`). Só disparar do server. Quem já completou (save) não dispara de novo.

A implementação por jogo (funis, recibos, economia) é feita pela skill `/paragon-analytics`.

## Testar notificações de compra (Konsole)

No jogo (Studio ou servidor publicado), abra o Konsole (tecla `T`) e rode:

```
simbuy                      # 99 Robux, developer product, "Item de teste"
simbuy 499 gamepass VIP     # valor, tipo e nome
```

- Dispara uma compra **simulada** pelo mesmo caminho de uma real (envio imediato → painel → push no celular, ntfy, Discord).
- O painel marca como `🧪 TESTE` e **não grava na receita** nem nos gráficos.
- Só o dono do jogo (ou cargo ≥ 254 no grupo dono) pode usar; no Studio, todos (`KonsoleService`).
- No Studio precisa de `PARAGON_ENABLED_IN_STUDIO = true` e da chave preenchida.
