---
name: new-component
description: Cria um component Flamework (@flamework/components) ligado a instâncias via tag, estendendo Destroyable para limpeza automática. Usar para comportamento por instância (portas, NPCs, zonas, pickups).
argument-hint: <nome> [client|server|shared] [tag]
---

# Novo component

Alvo: `$ARGUMENTS`

## Local

- `src/client/components/`, `src/server/components/` ou `src/shared/components/` — nome `kebab-case.ts`, classe `PascalCase` + `Component`.

## Template

```ts
import { Component } from "@flamework/components";
import type { OnStart } from "@flamework/core";
import Destroyable from "shared/components/destroyable";

interface Attributes {
  Speed: number;
}

@Component({ tag: "Example" })
export class ExampleComponent extends Destroyable<Attributes, BasePart> implements OnStart {
  public onStart(): void {
    this.bin.add(this.instance.Touched.Connect((hit) => this.onTouched(hit)));
  }

  private onTouched(hit: BasePart): void {
    // ...
  }
}
```

## Regras

- Estender `Destroyable` sempre que criar connection/instance/tween; registrar tudo no `this.bin`.
- Config por instância vem de `Attributes` (tipados), não de valores hardcoded.
- Component não injeta sistemas. Efeitos globais → escrever em state; server-side autoritativo → service reage.
- Lógica reaproveitável → `shared/utils`.
- Encerrar com `this.destroy()` (limpa bin e remove o component).

## Finalizar

`bun run check` e `bun run build`.
