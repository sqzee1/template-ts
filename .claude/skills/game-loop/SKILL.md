---
name: game-loop
description: Cria ou altera o orquestrador do jogo (GameLoopService / GameLoopController em game-loop.ts), o único arquivo autorizado a injetar e sequenciar vários sistemas e a ser dono do state de fase. Usar para fluxo de rounds/fases ou ordem de update por frame.
argument-hint: [server|client] [descrição do fluxo]
---

# Game loop

Alvo: `$ARGUMENTS`

## Arquivos

- Server: `src/server/services/game-loop.ts` → `GameLoopService`
- Client: `src/client/controllers/game-loop.ts` → `GameLoopController`
- Fase: `src/shared/states/game-phase-state.ts`

```ts
import { atom } from "@rbxts/charm";

export const enum GamePhase {
  Lobby,
  Round,
  Results,
}

export const gamePhaseAtom = atom(GamePhase.Lobby);
```

Se o client precisa da fase, sincronizar pelo `EmitterService`/`EmitterController` (ver `/new-state`).

## Template server

```ts
import { type OnStart, Service } from "@flamework/core";
import { GamePhase, gamePhaseAtom } from "shared/states/game-phase-state";

const LOBBY_DURATION = 15;
const ROUND_DURATION = 120;

@Service({})
export class GameLoopService implements OnStart {
  constructor(private readonly roundService: RoundService) {}

  public onStart(): void {
    task.spawn(() => this.run());
  }

  private run(): void {
    while (true) {
      this.enterPhase(GamePhase.Lobby, LOBBY_DURATION);
      this.roundService.prepare();
      this.enterPhase(GamePhase.Round, ROUND_DURATION);
      this.roundService.finish();
    }
  }

  private enterPhase(phase: GamePhase, duration: number): void {
    gamePhaseAtom(phase);
    task.wait(duration);
  }
}
```

## Update por frame ordenado

Quando a ordem entre sistemas importa, o loop implementa o hook e chama explicitamente:

```ts
public onPreSimulation(dt: number): void {
  this.movementController.update(dt);
  this.cameraShakeController.update(dt);
}
```

Esses sistemas **não** implementam o hook de frame eles mesmos.

## Regras

- Único lugar com múltiplas injeções. Ninguém injeta o game loop.
- O loop decide **quando**; o sistema decide **como**. Nada de regra de jogo aqui.
- Sistemas reagem à fase com `@UseAtom(gamePhaseAtom)` em vez de receber chamada, sempre que possível. Chamada direta só para passos que precisam de ordem/retorno.
- Este é o único arquivo em que `while (true)` + `task.wait` é aceitável, dentro de `task.spawn`.
- Constantes de duração no topo do módulo.

## Finalizar

`bun run check` e `bun run build`.
