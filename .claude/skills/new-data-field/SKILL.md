---
name: new-data-field
description: Adiciona ou altera um campo no save do jogador (PlayerTemplate, template do ProfileStore e migração quando o shape muda). Usar em qualquer mudança de dado persistente.
argument-hint: <Campo> <tipo> [valor padrão]
---

# Campo de dado persistente

Alvo: `$ARGUMENTS`

## Passos

1. `types/game.d.ts` → adicionar o campo em `PlayerTemplate` (PascalCase, como `Coins`).
2. `src/shared/states/profile-state.ts` → valor padrão em `template`.
3. Migração em `src/shared/data/migrations.ts` — **só se o shape de saves antigos muda**:
   - Campo apenas novo: não precisa, `profile.Reconcile()` preenche.
   - Renomear / remover / converter tipo / mover para objeto aninhado: adicionar função no **final** do array `migrations`.

   ```ts
   export const migrations: readonly Migration[] = [
     // v0 -> v1
     (data) => {
       data.Gems = data.Diamonds;
       data.Diamonds = undefined;
     },
   ];
   ```

4. Escrita no server via `PlayerDataService` (`setData`, `addAmountToKey`, `removeAmountFromKey`). Se precisar de operação nova e reutilizável, adicionar método genérico lá.
5. Leitura no client via `DataController.getData()` ou `getProfileData()`; reação via `subscribe(getProfileData, ...)`.

## Regras

- Nunca editar, remover ou reordenar migrações existentes — `DATA_VERSION` é o tamanho do array.
- Migração é pura e tolerante: checa `typeIs` antes de converter.
- Nunca escrever no profile direto (`profile.Data`) fora do `ProfileService`.
- Dados grandes/listas: pensar no custo de sync do `charm-sync` antes.

## Finalizar

`bun run check` e `bun run build`.
