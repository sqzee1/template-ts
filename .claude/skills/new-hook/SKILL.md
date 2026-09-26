---
name: new-hook
description: Cria um novo hook de ciclo de vida (interface + dispatch em hook-manager via Modding.onListenerAdded) para que sistemas reajam a eventos da engine sem se conhecerem.
argument-hint: <OnNomeDoHook> [client|server|shared] [evento da engine]
---

# Novo hook de ciclo de vida

Alvo: `$ARGUMENTS`

## Passos

1. **Interface** no arquivo certo:
   - Dois lados → `src/shared/hooks.ts`
   - Só client → `src/client/hook-managers/hooks.ts`
   - Só server → `src/server/hook-managers/hooks.ts`

   ```ts
   export interface OnExample {
     onExample(value: number): void;
   }
   ```

2. **Dispatch**: se o evento pertence a um manager existente (RunService, Character, Players), adicionar nele. Senão, criar `src/<lado>/hook-managers/<kebab>.ts`:

   ```ts
   @Controller({})
   export class ExampleHookController implements OnStart {
     public onStart(): void {
       const listeners = new Set<OnExample>();
       Modding.onListenerAdded<OnExample>((object) => listeners.add(object));
       Modding.onListenerRemoved<OnExample>((object) => listeners.delete(object));

       SomeEngineEvent.Connect((value) => {
         for (const listener of listeners) listener.onExample(value);
       });
     }
   }
   ```

3. Sistemas consumidores apenas `implements OnExample`.

## Regras

- Nome `On<Evento>`, método `on<Evento>`, um método por interface.
- Manager não tem lógica de jogo — só coleta e despacha.
- Listener que pode yield/errar sem derrubar os outros → `task.spawn` (padrão do `PlayersService`).
- `loadOrder` baixo no manager se outros sistemas dependem do hook já no boot.
- Hook-managers ficam em `hook-managers/`, path já registrado no runtime.

## Finalizar

`bun run check` e `bun run build`.
