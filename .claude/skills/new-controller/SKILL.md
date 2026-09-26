---
name: new-controller
description: Cria um controller Flamework client isolado seguindo o padrão do FOVController (docs/ARCHITECTURE.md seção 3) (sem dependências, estado privado, API mínima, reação a states). Usar ao criar qualquer sistema novo no client.
argument-hint: <nome-do-sistema> [descrição]
---

# Novo controller client

Alvo: `$ARGUMENTS`

## Antes de escrever

1. Ler as seções 3–5 de `docs/ARCHITECTURE.md` (a seção 3 tem o `FOVController` completo, exemplo canônico).
2. Confirmar que o sistema não existe (`src/client/controllers/`) e que a lógica pura não existe em `src/shared/utils/`.
3. Decidir como o sistema **recebe** mudanças:
   - Outro sistema escreve algo que ele aplica → state em `src/client/states/<nome>-state.ts` + `@UseAtom` (usar `/new-state`).
   - Evento da engine/ciclo de vida → implementar hook (`OnCharacterAdd`, `OnRenderStep`...).
   - Input → `@OnInput` de `client/decorators.ts`.
   - Mensagem do server → `@OnClientMessage` de `client/decorators.ts`.
   - Chamado só pelo game loop → API pública.

## Template

```ts
import { Controller } from "@flamework/core";
import { UseAtom } from "shared/decorators";
import { exampleAtom } from "client/states/example-state";

@Controller({})
export class ExampleController {
  private resource: Instance | undefined = undefined;

  private destroyResource() {
    if (this.resource) {
      this.resource.Destroy();
      this.resource = undefined;
    }
  }

  @UseAtom(exampleAtom)
  private onExampleChanged(value: number, previous: number) {
    this.apply(value);
  }

  public apply(value: number) {
    this.destroyResource();
    // ...
  }
}
```

## Regras

- Arquivo `src/client/controllers/<kebab-case>.ts`, classe `<PascalCase>Controller`.
- **Sem `constructor` com injeção.** Única exceção comum: `DataController` quando precisa do dado do jogador. Justificar na resposta ao usuário se injetar.
- Acesso à engine direto (`Workspace.CurrentCamera`, `Player` de `client/utility/utility`), sem wrapper.
- Estado interno `private`. API pública só com o que o game loop ou a UI realmente chamam.
- Recurso novo substitui o anterior só depois de destruí-lo; callbacks assíncronos checam identidade (`if (this.tween !== tween) return;`).
- `loadOrder` só se a ordem de boot for obrigatória.
- Não registrar o path: `src/client/controllers` já está em `runtime.client.ts`.

## Finalizar

Rodar `bun run check` e `bun run build`. Corrigir erros antes de reportar.
