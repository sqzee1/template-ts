---
name: new-system
description: Orquestra a criação de um sistema completo (dado, mensagem, state, service, controller, component, hook, game loop) a partir de uma descrição em linguagem natural, executando as skills específicas na ordem do WORKFLOW.md. Usar quando o usuário descrever uma feature/sistema que envolve mais de uma peça.
argument-hint: <descrição do sistema>
---

# Novo sistema completo

Pedido: `$ARGUMENTS`

## 1. Entender

Ler `docs/ARCHITECTURE.md` e `WORKFLOW.md`. Se algo essencial estiver ambíguo (quem é autoridade, o que persiste, o que o client vê), perguntar **uma vez**, agrupando as dúvidas. Não perguntar o que dá para decidir pelo padrão.

## 2. Planejar

Montar e mostrar ao usuário um plano curto, listando só as peças necessárias, na ordem abaixo:

| Ordem | Peça | Skill | Quando entra |
|---|---|---|---|
| 1 | Dado persistente | `new-data-field` | Algo precisa sobreviver ao rejoin |
| 2 | Mensagem de rede | `new-message` | Client pede ação ao server ou server avisa evento pontual |
| 3 | State | `new-state` | Um sistema escreve algo que outro lê |
| 4 | Hook | `new-hook` | Precisa de evento de ciclo de vida que ainda não existe |
| 5 | Service | `new-service` | Lógica autoritativa |
| 6 | Component | `new-component` | Comportamento por instância com tag |
| 7 | Controller | `new-controller` | Reflexo no client (visual, input, câmera, som) |
| 8 | Game loop | `game-loop` | Sistema entra no fluxo de fases ou precisa de ordem por frame |

Para cada peça: arquivo, nome da classe/state, e **como ela se comunica** (state, hook, message, injeção permitida). Nenhuma injeção fora das exceções do `docs/ARCHITECTURE.md` seção 5.

Esperar o ok do usuário antes de escrever código.

## 3. Executar

Para cada peça do plano, na ordem, invocar a skill correspondente com a ferramenta Skill e seguir as instruções dela. Não rodar `bun run check`/`build` entre cada peça — só no fim, para não falhar por peça ainda não criada.

## 4. Validar

1. `bun run check` e `bun run build`; corrigir até passar.
2. Invocar `arch-review` sobre os arquivos criados e corrigir violações.
3. Reportar: arquivos criados, fluxo de dados em uma linha (ex.: `input -> Message.Buy -> ShopService valida -> PlayerDataService -> sync -> ShopController`), e o que testar no Studio.
