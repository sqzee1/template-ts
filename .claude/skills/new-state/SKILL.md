---
name: new-state
description: Cria um state (atom ou signal do @rbxts/charm) e liga o sistema dono para reagir com @UseAtom/subscribe. Usar sempre que um sistema precisar escrever algo que outro sistema lê.
argument-hint: <nome> [client|shared] [tipo]
---

# Novo state

Alvo: `$ARGUMENTS`

## Decidir

1. **Local:**
   - Só client → `src/client/states/<nome>-state.ts` (criar a pasta se não existir).
   - Compartilhado / sincronizado → `src/shared/states/<nome>-state.ts`.
2. **Tipo:**
   - `atom` — padrão. Funciona com `@UseAtom`.
   - `signal` → `[get, set]` — quando só o dono pode escrever; exporta o getter amplo, setter restrito. Padrão do `profile-state.ts`.
   - Por jogador → `Map<number, ...>` com `get<Nome>Signal(userId)`, `remove<Nome>Signal(userId)` e `get<Nome>Key(userId)` (copiar estrutura de `profile-state.ts`).

## Template atom

```ts
import { atom } from "@rbxts/charm";

export const DEFAULT_EXAMPLE = 0;

export const exampleAtom = atom(DEFAULT_EXAMPLE);
```

## Reação no sistema dono

```ts
@UseAtom(exampleAtom)
private onExampleChanged(value: number, previous: number) {
  // aplicar efeito
}
```

Para getter de `signal` (não é `Atom`): no `onStart`, `subscribe(getExample, (value, previous) => ...)` e guardar o unsubscribe se o sistema puder ser desligado.

## Sincronizar com o client (se shared)

Seguir o fluxo existente: `EmitterService` adiciona o signal com `server.addSignalsToClient` e `EmitterController` registra o setter com `client.addSignals`. Remover na saída do jogador.

## Regras

- Um state por conceito, nome no singular e descritivo (`fovAtom`, `gamePhaseAtom`).
- Atualização imutável: `atom((prev) => ({ ...prev, key: value }))`.
- Reações não disparam com o valor inicial — ler no `onStart` se precisar.
- Não escrever no top-level do módulo (antes do `Flamework.ignite`).
- State não tem lógica: só valor inicial e, no máximo, funções `get/remove/key` de indexação.

## Finalizar

`bun run check` e `bun run build`.
