# CLAUDE.md

Template de jogo Roblox em **roblox-ts + Flamework**. State com `@rbxts/charm` (+ `charm-sync`), rede com `@rbxts/tether`, dados com `ProfileStore`, UI com `Vide`.

- Padrões completos: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — ler antes de criar ou refatorar sistema.
- Ordem de construção de features: [WORKFLOW.md](WORKFLOW.md).
- Exemplo canônico de estilo: `FOVController` em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) seção 3 (arquivo removido do repo; a doc tem a cópia integral).

## Comandos

```bash
bun run build   # rbxtsc — typecheck + compila
bun run check   # biome check --write ./src — lint + format
bun run watch   # rbxtsc -w
bun run serve   # rojo serve
```

Depois de qualquer mudança em `src/`: rodar `bun run check` e `bun run build`. Não existe suíte de testes; validação final é no Studio.

## Regras que não se negocia

1. **Sistemas isolados.** Controller/service não injeta outro controller/service. Exceções: acesso a dados (`DataController`, `PlayerDataService`), fachada de infra (`PlayerDataService` → `ProfileService`) e o game loop. Nunca circular.
2. **Escrita via state.** Mudança que outro sistema enxerga = atom/signal em `src/shared/states/` ou `src/client/states/`. Quem se importa reage com `@UseAtom` (`shared/decorators.ts`) ou `subscribe`.
3. **Game loop orquestra.** Só `GameLoopService` / `GameLoopController` (`game-loop.ts`) chama vários sistemas e define ordem. Ninguém injeta o game loop; sistemas reagem ao state de fase.
4. **Engine direto.** Precisa da câmera? `Workspace.CurrentCamera`. Não crie/injete wrapper.
5. **Lógica pura em `src/shared/utils/*-utils.ts`**, como função exportada. Procure lá antes de escrever helper novo.
6. **Server é autoridade.** Todo `Message` do client tem policy em `server/middleware/policies.ts` e payload validado.
7. **Ciclo de vida por hooks** (`OnStart`, `OnCharacterAdd`, `OnPlayerJoin`, `OnPreSimulation`, `OnRenderStep`...). Nada de `while true` + `task.wait`.
8. **Tudo que é criado é destruído** (tween, connection, instance). Components estendem `Destroyable` e usam `this.bin`.

## Convenções

- Arquivos `kebab-case.ts` sem sufixo (`fov.ts`, `player-data.ts`); classes `XController` / `XService`; states `x-state.ts`; utils `x-utils.ts`.
- Imports absolutos (`client/...`, `shared/...`, `server/...`); `import type` para tipos.
- `public`/`private` explícitos, `private readonly` para dependências e coleções.
- Constantes `UPPER_SNAKE_CASE` no topo do módulo; `const enum` para enums.
- Early return, métodos curtos, nomes completos (sem `cfg`, `mgr`, `fn`).
- Comentário só para o porquê não óbvio.
- Código em inglês; docs em português.

## Skills do projeto

Usar a skill certa em vez de improvisar:

Quando o usuário descrever um sistema com mais de uma peça, usar `/new-system` — ele planeja e chama as outras skills na ordem.

| Skill | Quando |
|---|---|
| `/new-system` | Sistema completo descrito em linguagem natural (orquestra as abaixo) |
| `/new-controller` | Novo sistema client |
| `/new-service` | Novo sistema server |
| `/new-state` | Novo atom/signal + reação |
| `/new-message` | Nova mensagem de rede client ↔ server |
| `/new-hook` | Novo hook de ciclo de vida + manager |
| `/new-data-field` | Campo novo no save do jogador (+ migração) |
| `/new-component` | Novo component Flamework |
| `/game-loop` | Criar/alterar o orquestrador |
| `/arch-review` | Auditar mudanças contra estas regras |
