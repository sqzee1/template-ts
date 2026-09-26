# Arquitetura e Padrões de Código

Documento de referência para qualquer código novo neste template (roblox-ts + Flamework). O exemplo canônico de estilo é o `FOVController` da seção 3 (copiado integralmente aqui; o arquivo não existe mais no repo). Se o código do projeto evoluir o padrão, atualize este documento.

Complementa o [WORKFLOW.md](../WORKFLOW.md), que define a **ordem** de construção (dado → shared → server → client → estado → UI). Este arquivo define **como** cada peça é escrita.

---

## 1. Princípios

1. **Sistemas isolados.** Cada controller/service resolve o próprio problema e não conhece os outros. Nada de injetar controller dentro de controller "por conveniência".
2. **Escrita via estado, leitura via reação.** Mudança que outro sistema precisa enxergar é escrita num **state** (atom/signal do `@rbxts/charm`). Quem se importa **reage** à mudança (`@UseAtom` / `subscribe`). Quem escreve não sabe quem escuta.
3. **Um único orquestrador.** O fluxo do jogo (fases, rounds, ordem de update por frame) vive num arquivo de **game loop**. Ele é o único lugar autorizado a chamar vários sistemas diretamente.
4. **Engine direto, sem wrapper.** Se o sistema precisa da câmera, pega `Workspace.CurrentCamera`. Não injeta um `CameraController` só para isso (ver `FOVController`, seção 3).
5. **Lógica pura fora de classe.** Cálculo sem efeito colateral vai para `src/shared/utils/*` como função exportada, reutilizável em client e server.
6. **Server é autoridade.** Client nunca é fonte de verdade de dado persistente; ele pede (message), o server valida e escreve no state sincronizado.

---

## 2. Mapa de pastas

| Caminho | O que vai aqui |
|---|---|
| `src/client/controllers/` | Controllers (`@Controller`) — um sistema client por arquivo |
| `src/client/hook-managers/` | Controllers que despacham hooks de ciclo de vida (RunService, Character) |
| `src/client/states/` | States **só do client** (`*-state.ts`). Criar a pasta quando precisar |
| `src/client/utility/` | Referências globais do client (`Player`, `PlayerGui`) e o `data-state.ts` legado |
| `src/client/ui/` | UI em Vide |
| `src/client/components/` | Components (`@Component`) só do client |
| `src/server/services/` | Services (`@Service`) — um sistema server por arquivo |
| `src/server/hook-managers/` | Services que despacham hooks (Players, Character, RunService) |
| `src/server/middleware/` | Middleware de rede (rate limit + `policies.ts`) |
| `src/shared/states/` | States compartilhados/sincronizados (`*-state.ts`) |
| `src/shared/hooks.ts` | Interfaces de hook usadas nos dois lados |
| `src/shared/messaging.ts` | Contrato de rede (`Message` + `MessageData`, tether) |
| `src/shared/decorators.ts` | `@UseAtom` |
| `src/shared/utils/` | Funções puras (`*-utils.ts`) |
| `src/shared/data/migrations.ts` | Migrações do save |
| `src/shared/components/` | Components compartilhados (`Destroyable`) |
| `types/game.d.ts` | Tipos globais do jogo (`PlayerTemplate`, `CharacterModel`) |
| `types/global.d.ts` | Tipos utilitários globais (`Maybe`, `NumberKeys`...) |

---

## 3. Anatomia de um controller (exemplo canônico: `FOVController`)

Este é o exemplo de referência do projeto. O arquivo original (`src/client/controllers/fov.ts`) foi removido do repo; a versão abaixo é a cópia integral e vale como fonte da verdade para estilo de controller/service.

```ts
import { Controller } from "@flamework/core";
import { TweenService, Workspace } from "@rbxts/services";

@Controller({})
export class FOVController {
  private currentFov: number = 0;
  private tween: Tween | undefined = undefined;

  private getCamera() {
    return Workspace.CurrentCamera!;
  }

  private destroyTween() {
    if (this.tween) {
      this.tween.Destroy();
      this.tween = undefined;
    }
  }

  public set(fov: number) {
    this.destroyTween();

    const camera = this.getCamera();
    camera.FieldOfView = fov;
    this.currentFov = fov;
  }

  public get() {
    return this.currentFov;
  }

  public reset(fov: number) {
    this.set(fov);
  }

  public setWithTween(fov: number, tweenInfo: TweenInfo) {
    this.destroyTween();

    const camera = this.getCamera();
    const tween = TweenService.Create(camera, tweenInfo, { FieldOfView: fov });

    tween.Play();
    this.tween = tween;

    tween.Completed.Once(() => {
      if (this.tween !== tween) return;

      this.currentFov = fov;
      this.tween = undefined;
    });
  }
}
```

O que esse exemplo ensina:

- **Zero dependências de construtor.** Não existe `constructor(private readonly camera: CameraController)`. A câmera vem da engine.
- **Estado interno privado.** `currentFov` e `tween` são `private`; ninguém de fora mexe.
- **Helpers privados pequenos** (`getCamera`, `destroyTween`) em vez de repetir código.
- **API pública mínima e com verbo claro:** `set`, `get`, `reset`, `setWithTween`.
- **Recurso sempre limpo antes de criar outro:** `destroyTween()` antes de cada `set`/`setWithTween`.
- **Guarda de identidade em callback assíncrono:** `if (this.tween !== tween) return;` evita que um tween antigo sobrescreva o estado de um tween novo.
- **Arquivo curto, uma responsabilidade.**

### Checklist de um controller/service

- [ ] Arquivo `kebab-case.ts` sem sufixo (`fov.ts`, `player-data.ts`, nunca `fov-controller.ts`); classe `PascalCase` + `Controller`/`Service` (`FOVController`, `PlayerDataService`).
- [ ] `@Controller({})` / `@Service({})`. Só usa `loadOrder` quando a ordem de boot realmente importa (hook-managers, emitter, network-guard).
- [ ] Sem injeção de outros sistemas (ver seção 5 para exceções).
- [ ] Modificadores explícitos (`public`/`private`), `readonly` para o que não é reatribuído.
- [ ] Constantes em `UPPER_SNAKE_CASE` no topo do módulo (`KICK_REASON`, `RENDER_STEP_NAME`).
- [ ] Tudo que é criado (tween, connection, instance) tem dono e é destruído.
- [ ] Ciclo de vida via hooks (`OnStart`, `OnCharacterAdd`, `OnPreSimulation`...), nunca `while true` / `task.wait` em loop.

---

## 4. Estado: atoms e signals

State = a única forma de um sistema **escrever** algo que outro sistema lê.

### Onde fica

- `src/shared/states/<nome>-state.ts` — state compartilhado ou sincronizado via `charm-sync` (ex.: `profile-state.ts`).
- `src/client/states/<nome>-state.ts` — state só do client (ex.: FOV desejado, menu aberto, fase local).
- State só do server pode ficar em `src/shared/states` se for sincronizado; caso contrário, `src/server/states/`.

### atom vs signal

| Use | Quando |
|---|---|
| `atom<T>(initial)` | State simples, lido/escrito pelo mesmo tipo de consumidor. Funciona direto com `@UseAtom`. |
| `signal<T>(initial)` → `[get, set]` | Quando quer **separar** quem lê de quem escreve (exporta o getter para todos, o setter só para quem é dono). É o padrão do profile. |

Para state por jogador, siga `profile-state.ts`: um `Map<number, ...>` com `get...Signal(userId)` que cria sob demanda, `remove...Signal(userId)` na saída, e `get...Key(userId)` para o nome de sincronização.

### Exemplo — state client

```ts
// src/client/states/fov-state.ts
import { atom } from "@rbxts/charm";

export const DEFAULT_FOV = 70;

export const fovAtom = atom(DEFAULT_FOV);
```

Qualquer sistema escreve sem conhecer o `FOVController`:

```ts
import { fovAtom } from "client/states/fov-state";

fovAtom(90);
```

O dono reage:

```ts
import { UseAtom } from "shared/decorators";
import { fovAtom } from "client/states/fov-state";

@Controller({})
export class FOVController {
  @UseAtom(fovAtom)
  private onFovChanged(fov: number, previous: number) {
    this.set(fov);
  }
}
```

### Regras de state

- **Imutável.** Atualize com objeto novo: `setData((prev) => ({ ...prev, Coins: prev.Coins + 1 }))`. Nunca mute o objeto retornado.
- **`subscribe`/`@UseAtom` não disparam com o valor inicial.** Se o sistema precisa do valor atual ao iniciar, leia no `onStart`.
- **Não escreva em atom no top-level do módulo.** `@UseAtom` resolve o singleton via Flamework; escrever antes do `ignite` quebra.
- `@UseAtom` recebe `Atom<T>`. Para reagir a um getter de `signal`, use `subscribe(getter, listener)` no `onStart` e guarde o unsubscribe.
- Um state por conceito. Não crie "god state" com tudo do jogo.

---

## 5. Dependências entre sistemas

Ordem de preferência para um sistema falar com outro:

1. **State** (atom/signal + `@UseAtom`) — padrão para qualquer escrita.
2. **Hook** (interface implementada + hook-manager) — para eventos de ciclo de vida (`OnCharacterAdd`, `OnPlayerJoin`, `OnPreSimulation`...).
3. **Message** (tether, `@OnMessage` / `@OnClientMessage`) — atravessar client ↔ server.
4. **Função pura** em `shared/utils` — lógica reaproveitável sem estado.
5. **Injeção via construtor** — último recurso.

### Injeção permitida

A injeção via `constructor(private readonly x: XService)` é aceitável somente quando:

- **Acesso a dados do jogador.** Ex.: um `InventoryController` precisa do `DataController`; um service de loja precisa do `PlayerDataService`. Isso é esperado.
- **Camada de fachada sobre infraestrutura.** Ex.: `PlayerDataService` → `ProfileService`.
- **Game loop.** O orquestrador pode injetar os sistemas que ele coordena.

Sempre proibido:

- Dependência circular (A injeta B e B injeta A, direta ou indiretamente).
- Sistema injetar o game loop.
- Injetar um sistema só para ler um valor que deveria estar num state.
- Injetar um wrapper da engine (`CameraController` só para pegar a câmera) quando dá para acessar a engine direto.

Se a injeção for necessária, mantenha **uma** dependência, `private readonly`, e chame só métodos públicos dela.

---

## 6. Game loop (orquestrador)

O único arquivo que "conhece todo mundo".

- Server: `src/server/services/game-loop.ts` → `GameLoopService`.
- Client: `src/client/controllers/game-loop.ts` → `GameLoopController`.

Responsabilidades:

- Dono da **fase** do jogo (`src/shared/states/game-phase-state.ts`, sincronizada se o client precisar). Sistemas reagem à fase com `@UseAtom`; não perguntam ao loop.
- Sequenciar fases (lobby → round → resultados) e chamar a API pública dos sistemas envolvidos na ordem certa.
- Update por frame **ordenado**: quando a ordem de execução entre sistemas importa, o loop implementa o hook (`OnPreSimulation`/`OnRenderStep`) e chama `system.update(dt)` na ordem desejada.

Não é responsabilidade do loop:

- Lógica de sistema (cálculo de dano, inventário etc.). O loop só decide **quando**, o sistema decide **como**.
- Update independente de ordem (um efeito girando, por exemplo): o próprio sistema implementa o hook.

```ts
@Service({})
export class GameLoopService implements OnStart {
  constructor(
    private readonly roundService: RoundService,
    private readonly spawnService: SpawnService,
  ) {}

  public onStart(): void {
    task.spawn(() => this.run());
  }

  private run(): void {
    // lobby → round → resultados, escrevendo em gamePhaseAtom a cada transição
  }
}
```

---

## 7. Hooks de ciclo de vida

Padrão de `src/*/hook-managers/*`:

1. Interface em `shared/hooks.ts` (os dois lados), `client/hook-managers/hooks.ts` ou `server/hook-managers/hooks.ts`.
2. Um hook-manager coleta listeners com `Modding.onListenerAdded<I>` / `Modding.onListenerRemoved<I>` num `Set<I>` e despacha no evento da engine.
3. Sistemas só implementam a interface — sem registrar nada manualmente.

Hooks existentes:

| Hook | Lado | Disparo |
|---|---|---|
| `OnCharacterAdd` / `OnCharacterRemove` | ambos | personagem entra/sai |
| `OnPreSimulation` / `OnPostSimulation` | ambos | RunService |
| `OnPreAnimation` / `OnRenderStep` | client | RunService / BindToRenderStep |
| `OnPlayerJoin` / `OnPlayerLeave` | server | Players (via `task.spawn`) |

---

## 8. Rede

- Contrato em `src/shared/messaging.ts`: adicione no `const enum Message` e tipe o payload em `MessageData`.
- **Todo** `Message` precisa de entrada em `src/server/middleware/policies.ts` (`undefined` só para server → client). O tipo força isso.
- Server recebe com `@OnMessage(Message.X)` (`server/decorators.ts`) — assinatura `(player, data)`.
- Client recebe com `@OnClientMessage(Message.X)` (`client/decorators.ts`).
- Dado do jogador chega no client via `charm-sync` (`EmitterService` → `EmitterController` → `data-state`). Não crie message para replicar dado que já está no profile.
- Server valida tudo que vem do client (tipo, limites, cooldown). Nunca confie no payload.

---

## 9. Input

Use `@OnInput(binding)` / `@OnInputDeactivated(binding)` de `client/decorators.ts` em métodos do controller. Binding aceita `RawInput`, `RawInput[]` ou `StandardAction` do `@rbxts/mechanism`. Não conecte `UserInputService` na mão.

---

## 10. Dados persistentes

1. Campo novo em `PlayerTemplate` (`types/game.d.ts`).
2. Valor padrão em `template` (`src/shared/states/profile-state.ts`).
3. Se muda o shape de um save existente (renomear/remover/converter campo), adicione uma migração no **final** de `migrations` (`src/shared/data/migrations.ts`). Nunca edite/reordene migrações antigas. Campo apenas novo é resolvido por `profile.Reconcile()`.
4. Server escreve via `PlayerDataService` (`setData`, `addAmountToKey`...). Client lê via `DataController` / `getProfileData`.

---

## 11. Components e limpeza

- Components que criam recursos estendem `Destroyable` (`shared/components/destroyable.ts`) e registram tudo no `this.bin`.
- Em controllers/services, guarde a referência do recurso e destrua antes de substituir (padrão `destroyTween`).
- Connections criadas por jogador/personagem são desconectadas na saída (`OnPlayerLeave`, `OnCharacterRemove`).

---

## 12. Estilo de código

Imposto pelo Biome (`bun run check`) — rodar antes de commitar:

- 2 espaços, aspas duplas, ponto e vírgula, trailing commas, `lineWidth` 180.
- `===` sempre, sem `any`, sem `var`, sem `namespace`.
- `!` (non-null) permitido quando a engine garante (`Workspace.CurrentCamera!`).

Convenções do projeto:

- Imports absolutos a partir de `src` (`client/...`, `server/...`, `shared/...`), nunca `../`.
- `import type` para o que é só tipo.
- Retorno explícito em métodos públicos de services (`: void`, `: PlayerTemplate | undefined`).
- `const enum` para enums de rede/estado.
- Nomes completos e descritivos; sem abreviações inventadas.
- Comentário só quando o **porquê** não é óbvio. JSDoc em campos de interface de configuração (ver `RateLimitPolicy`).
- Early return em vez de `if` aninhado.
- Funções curtas; se um método passa de ~30 linhas, extraia helpers privados.
- Reuso primeiro: antes de criar uma função, procure em `shared/utils`.
