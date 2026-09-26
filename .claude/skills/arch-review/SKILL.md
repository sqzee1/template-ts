---
name: arch-review
description: Audita o diff atual (ou arquivos informados) contra os padrões de docs/ARCHITECTURE.md — isolamento de sistemas, escrita via state, game loop, limpeza de recursos, validação de rede e estilo. Usar antes de commitar ou quando pedirem revisão de arquitetura.
argument-hint: [arquivos ou vazio para o diff atual]
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git status:*), Bash(bun run check:*), Bash(bun run build:*)
---

# Revisão de arquitetura

Alvo: `$ARGUMENTS` (vazio = `git diff HEAD` + arquivos não rastreados em `src/`).

## Verificações

Para cada arquivo alterado em `src/`:

1. **Injeção** — procurar `constructor(` com parâmetros em controllers/services/components.
   - OK: `DataController`, `PlayerDataService`, `ProfileService` (dentro de `PlayerDataService`), game loop.
   - Falha: qualquer outro sistema; injeção do game loop; ciclo.
   - Rodar `Grep` por `constructor\(private` em `src/` para mapear o grafo e detectar ciclos.
2. **Escrita cruzada** — sistema chamando método público de outro para mudar estado → deveria ser state + `@UseAtom`.
3. **Wrapper de engine** — sistema injetado só para acessar câmera/player/character.
4. **Game loop** — `while (true)`/`task.wait` em loop fora de `game-loop.ts`; lógica de regra dentro do game loop.
5. **Limpeza** — tween/connection/instance criado sem ser destruído; `Map<Player, ...>` sem limpeza em `onPlayerLeave`; component com recurso sem `Destroyable`/`bin`.
6. **Callback assíncrono** — sem guarda de identidade quando o recurso pode ser substituído (padrão `if (this.tween !== tween) return;`).
7. **Rede** — `Message` novo sem policy; handler `@OnMessage` sem validar payload; message criada para replicar dado que já está no profile.
8. **State** — mutação in-place; escrita em top-level; state com lógica.
9. **Dados** — campo em `PlayerTemplate` sem default em `template`; migração editada/reordenada; escrita em `profile.Data` fora do `ProfileService`.
10. **Estilo** — import relativo (`../`), abreviações, arquivo com sufixo (`-controller.ts`), helper duplicado que já existe em `shared/utils`, método gigante.

Depois rodar `bun run check` e `bun run build` e incluir falhas.

## Saída

Uma linha por achado, mais grave primeiro:

```
path:linha — [regra] problema. Correção sugerida.
```

Sem elogios. Se nada violar, dizer isso em uma linha. Não aplicar correções sem o usuário pedir.
