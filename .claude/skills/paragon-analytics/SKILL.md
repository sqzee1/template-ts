---
name: paragon-analytics
description: Implementa a telemetria do painel Paragon Studios Analytics num jogo roblox-ts + Flamework (template Paragon) — conecta o jogo ao painel (endpoint + chave), mapeia e instrumenta funis (tutorial, loja, onboarding, rebirth...), rastreia compras de developer products e game passes em tempo real, fluxo de moedas (economia), eventos e erros. Use sempre que o usuário pedir para "colocar analytics/telemetria/Paragon", "rastrear tutorial/funil/etapas", "rastrear compras/vendas/Robux", "monitorar economia/moeda", "ligar o jogo no painel" ou adicionar métricas a um jogo Roblox.
argument-hint: "[o que rastrear: tutorial | compras | economia | tudo] [detalhes]"
---

# Paragon Analytics — instrumentar um jogo

Alvo: `$ARGUMENTS` (vazio = fazer tudo: conexão + funis + compras + economia + eventos-chave).

O painel fica em `C:\Projects\site\roblox-info` (Node, `npm start`, http://localhost:3000). A referência da integração é o template `C:\Projects\typescript\template-ts` (`docs/PARAGON.md`).

## 0. Ler antes de escrever

1. `CLAUDE.md`, `docs/ARCHITECTURE.md` e `docs/PARAGON.md` do projeto — regras de sistemas isolados, escrita via state, server autoridade.
2. Conferir se a base Paragon existe no projeto:
   - `src/server/states/paragon-state.ts`, `src/server/constants/paragon.ts`
   - `src/server/services/paragon.ts`, `paragon-session.ts`, `paragon-purchase.ts`
   - `src/client/controllers/paragon.ts`, `src/shared/constants/paragon.ts`
   - `Message.ParagonDevice` em `src/shared/messaging.ts` + policy em `src/server/middleware/policies.ts`
3. **Faltando?** (projeto criado antes do template ter Paragon) → copiar esses arquivos de `C:\Projects\typescript\template-ts\src\...` para os mesmos caminhos e adicionar a mensagem + policy. Não reescrever do zero.

## 1. Conectar ao painel

1. Descobrir o jogo: `default.project.json`/place do usuário, ou perguntar o link do jogo.
2. O painel de produção fica em `https://paragonstudios.duckdns.org` (VM Oracle). A senha está em `%USERPROFILE%\.ssh\paragon-credenciais.txt`. Pegar a chave do jogo pela API com login:
   ```bash
   U=https://paragonstudios.duckdns.org
   PASS=$(grep "Senha do painel" ~/.ssh/paragon-credenciais.txt | sed 's/.*: //')
   curl -s -c /tmp/pg -X POST -H "Content-Type: application/json" -d "{\"password\":\"$PASS\"}" $U/api/login
   curl -s -b /tmp/pg $U/api/games                  # lista universe_id / name
   curl -s -b /tmp/pg $U/api/games/<UNIVERSE_ID>    # api_key + publicUrl
   rm -f /tmp/pg
   ```
   Jogo ainda não está no painel → `POST /api/games/resolve {"input":"<link>"}` e `POST /api/games {"universeIds":[id]}` (mesmo cookie), ou pedir ao usuário para adicionar pela UI. Nunca imprimir a senha nem a api_key no chat além do necessário.
3. Preencher `src/server/constants/paragon.ts`: `PARAGON_ENDPOINT = "https://paragonstudios.duckdns.org/api/ingest"` (já vem assim no template), `PARAGON_API_KEY = "<api_key>"`.
4. Lembrar o usuário: **Allow HTTP Requests = ON** no Game Settings.

## 2. Funis (tutorial e outros)

O objetivo é o painel mostrar onde os jogadores desistem ("80% param depois da etapa 3").

1. **Mapear o fluxo real lendo o código**: procurar tutorial/onboarding/quests (`grep -ri "tutorial\|onboard\|quest\|step\|stage"` em `src/`), o state de progresso (`*-state.ts`), campos do save (`types/game.d.ts`) e as mensagens envolvidas.
2. Montar a lista de etapas e **mostrar ao usuário antes de implementar** (tabela: nº, nome, onde dispara no código). Regras:
   - Etapas contíguas a partir de 1; a etapa 1 é a entrada no fluxo (ex.: "Spawned" / "Tutorial started").
   - Última etapa = conclusão ("Tutorial completed").
   - 4–10 etapas; granular onde há risco de abandono (combate, primeira compra, UI confusa).
   - Nome do funil estável em snake_case (`tutorial`, `shop`, `first_rebirth`). Nomes de etapa curtos em inglês ou português, consistentes.
   - **Nunca renumerar** um funil já publicado — mudou o fluxo, cria `tutorial_v2`.
3. Implementar **no server**, no sistema dono do progresso, com `trackFunnel(player, "tutorial", n, "Nome")` de `server/states/paragon-state`:
   - Preferir reagir ao state existente (ex.: `subscribe` no signal de progresso e mapear etapa → `trackFunnel`) em vez de espalhar chamadas.
   - Etapa que só acontece no client (abriu UI, leu diálogo): criar `Message` nova (`/new-message`) com payload `step: number`, policy de rate limit e **validação** (inteiro, dentro do intervalo, só a próxima etapa esperada para aquele jogador). Nunca aceitar etapa arbitrária do client.
   - Jogador que já concluiu (dado salvo) não dispara de novo. O painel deduplica por jogador+etapa, mas evite ruído.
4. Funis úteis além do tutorial (sugerir, não impor): `shop` (abriu loja → viu item → clicou comprar → comprou), `first_session_goals`, `rebirth`, `quest_<id>`.

## 3. Compras (tempo real)

- **Game passes**: já automáticos (`PromptGamePassPurchaseFinished` no `ParagonPurchaseService`). Nada a fazer.
- **Developer products**: achar o `MarketplaceService.ProcessReceipt` do jogo (`grep -rn "ProcessReceipt" src`).
  - Existe → chamar `trackReceipt(receipt)` **depois** de entregar o produto e **antes** de `return Enum.ProductPurchaseDecision.PurchaseGranted`. Só no caminho de sucesso.
  - Não existe → criar o service de produtos do jogo seguindo `/new-service` (handler por `ProductId`, entrega via `PlayerDataService`, idempotência por `PurchaseId` no save se o jogo precisar) e chamar `trackReceipt` no sucesso.
- Cada compra é enviada imediatamente (fura o lote de 15 s) → notificação push/ntfy/Discord e popup no painel em ~1 s. Não adicionar atrasos.
- Não duplicar: não chamar `trackReceipt` para game passes, nem em retentativas que retornam `NotProcessedYet`.

## 4. Economia (moedas do jogo)

- Encontrar onde moedas entram e saem (`addAmountToKey`, `removeAmountFromKey`, `setData` em campos de moeda).
- Instrumentar no **sistema de domínio** (quem sabe o motivo), não dentro do `PlayerDataService`: `trackEconomy(player, "Coins", +valor, "Quest")` / `trackEconomy(player, "Coins", -valor, "Shop", "SwordId")`.
- `transactionType` em PascalCase estável (`Quest`, `DailyReward`, `Shop`, `Upgrade`, `Rebirth`). `itemSku` = id do item comprado com moeda.
- Ganhos muito frequentes (ex.: moeda por segundo) → agregar e enviar a cada N segundos/ao sair, para não inundar a fila.

## 5. Eventos e erros

- `trackEvent(player, "BossKilled", 1, { boss })` para momentos que importam para design (boss, rebirth, pet raro, nível). Poucos e significativos; nada por frame.
- `trackError("ProfileLoadFailed", { reason })` em falhas reais (ProfileStore, estado inválido, pcall de serviço externo).

## 6. Finalizar

1. `bun run check` e `bun run build` — corrigir até passar.
2. Rodar `/arch-review` mental: nenhum service injetando outro por causa da telemetria; tudo via `paragon-state`.
3. Teste no Studio: `PARAGON_ENABLED_IN_STUDIO = true` + painel acessível → aba **Ao vivo** mostra a sessão; jogar o tutorial e ver a aba **Funis & Tutorial**; comprar em teste → notificação. Voltar `PARAGON_ENABLED_IN_STUDIO = false`.
4. Resumir para o usuário: funis criados (etapas), onde cada `track*` foi colocado, e o que falta configurar (chave, PUBLIC_URL, HTTP Requests).
