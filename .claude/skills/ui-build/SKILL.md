---
name: ui-build
description: Cria e ajusta interfaces (ScreenGui/HUD/painéis/menus/popups/botões/listas/cards) no Roblox Studio via MCP Roblox_Studio, em qualquer place, seguindo o padrão visual do jogo (bordas, cores, gradientes, textura de fundo, fonte, cantos) ou o padrão/imagem que o usuário mandar. Sempre centralizado, dimensionado em Scale, responsivo, sem z-fight de UI, com ícones quando pedido, verificado por checagem em várias resoluções e screenshot. Use sempre que o usuário pedir para fazer, refazer, melhorar, organizar ou copiar uma UI/tela/menu/painel/botão/HUD, inclusive a partir de uma imagem de referência.
---

# UI Build

Skill genérica para construir UI no Studio com `mcp__Roblox_Studio__execute_luau`. Nada aqui é fixo de um jogo: o estilo vem do **perfil** do place (survey) ou do pedido/imagem do usuário.

Arquivos (cada `execute_luau` é isolado: colar o conteúdo no topo da chamada):
- [ui-survey.luau](ui-survey.luau) — mede o estilo das UIs existentes: fontes, cores, strokes, cantos, gradientes, texturas, tags de components, atributos, uso de Scale vs Offset.
- [ui-dump.luau](ui-dump.luau) — despeja uma árvore de UI (posição, tamanho, z, strokes, gradientes...) para copiar um padrão exato. Ajustar `TARGET`.
- [ui-helpers.luau](ui-helpers.luau) — `THEME` + funções de construção (`panel`, `button`, `label`, `icon`, `surface`, `item`, `list`, `grid`, `scroll`...). Sobrescrever o `THEME` com o perfil logo depois de colar.
- [ui-checks.luau](ui-checks.luau) — clona a UI em 5 resoluções (PC, notebook, tablet, celular deitado) e acusa: fora da tela, vazando do pai, texto cortado/ilegível, descentralizado, z-fight (irmãos sobrepostos com mesmo ZIndex), Offset não responsivo, ícone esticado.
- `profiles/<place>.md` — perfil salvo de cada place (THEME pronto, paleta, onde montar, components).

## Fluxo

1. **Conectar**: `list_roblox_studios` → `studio_id` (confirmar place pelo nome). `get_studio_state` em `Edit`.
2. **Perfil de estilo**:
   - Existe `profiles/<place>.md`? Usar (reconfirmar rápido se o usuário disse que mudou algo).
   - Senão: rodar `ui-survey.luau`, depois `ui-dump.luau` em 2–3 peças típicas (um botão do HUD, um painel, um card de lista) e tirar screenshot com um painel visível (ligar `Visible`, capturar, **restaurar**). Salvar o perfil: bloco de override do `THEME`, paleta, regras de layout observadas, onde as UIs vivem, tags de components.
   - Pedido do usuário com outro padrão (imagem, "estilo X", cores) manda sobre o perfil. Se virar o novo padrão, atualizar o perfil.
3. **Planejar o layout antes de construir** (ver "Layout"): listar regiões, proporções (Scale) e componentes. Com imagem de referência: medir a imagem (ver "A partir de imagem").
4. **Onde montar**: seguir a convenção do place (ex.: painel novo dentro do contêiner de painéis existente, oculto como os irmãos). Sem convenção ou em dúvida: `ScreenGui` própria (`freshGui("<Feature>")`) em `StarterGui`. Nunca editar UI existente sem pedido; se precisar, mínimo e relatado.
5. **Construir**, cada chamada: helpers + override do perfil no topo; `freshGui`/destruir o elemento do tema antes (idempotente); tudo dentro de `record(nome, fn)` (Ctrl+Z).
6. **Verificar**:
   - `ui-checks.luau` com `TARGET` no que foi criado e `SHOW` com os nomes ocultos que devem aparecer. Meta: 0 problemas em todas as resoluções. Overflow intencional (header saindo do painel, badge no canto) leva atributo `AllowOverflow = true`.
   - `screen_capture` com a UI visível. Olhar de verdade: alinhamento, respiro, hierarquia, contraste, borda igual aos botões do jogo, ícones nítidos e do mesmo tamanho no grupo. Se algo foi ligado só para a foto, **desligar de volta**.
7. **Relatar**: o que foi criado (caminho, contagem de elementos), resultado da checagem, o que foi tocado fora, o que só dá pra ver em play (tweens, components por tag como hover).

## Dimensionamento e centralização (sempre)

- Tudo em **Scale** (`UDim2.fromScale`). Offset só em padding/gap pequeno e TileSize de textura.
- Centralizar = `AnchorPoint (0.5, 0.5)` + `Position (0.5, 0.5)`. Ancorar pelo lado que encosta: canto superior direito = `AnchorPoint (1, 0)` + `Position (1 - margem, margem)`.
- Toda caixa que precisa manter forma (painel, botão quadrado, ícone, card) tem `UIAspectRatioConstraint`. Ícone sempre `ratio = 1` + `ScaleType.Fit`.
- Item de lista/grade com aspect: Size `(largura, 0, 100, 0)` (helper `item`). Com Y = 0 o `FitWithinMaxSize` dá tamanho zero.
- Dentro de `ScrollingFrame`: `AutomaticCanvasSize = Y`, `CanvasSize = 0`, lista com `VerticalAlignment = Top` (Center corta o topo).
- Grupos repetidos via `UIListLayout`/`UIGridLayout` + `UIPadding`, nunca posição na mão. Um único valor de gap por grupo.
- Margem de tela ≥ 1.5% e respeitar `ScreenInsets = DeviceSafeInsets`. HUD nos cantos, modais no centro; modal não pode cobrir a barra de moedas se o jogo não faz isso.
- Tamanho mínimo de toque: botão ≥ ~40 px na menor resolução da checagem (667×375).
- Texto: `TextScaled` + `UITextSizeConstraint` (max do perfil) + stroke contextual do perfil. Caixa do texto com altura proporcional à função (título > item > legenda).

## Camadas (z-fight de UI)

`ZIndexBehavior = Sibling`. Irmãos que se sobrepõem **nunca** com o mesmo ZIndex. Ordem padrão (`Z` nos helpers):
`TEXTURE 1` → `DECOR 2` (brilho, espiral, glow) → `ICON 3` → `CONTENT 4` → `TEXT 5` → `OVERLAY 6` (botões por cima, close, badges). Dois strokes Border no mesmo objeto (borda dupla) são intencionais: a ordem de criação é a ordem do perfil.

## Estilo vindo do perfil

O `THEME` cobre: fonte, cor/stroke do texto, borda (lista de strokes, ex.: branco 50% + preto), modo de espessura (`ScaledSize` = espessura proporcional ao objeto, escala sozinha; `FixedSize` = pixels), cantos, textura de fundo (tile + transparência), fundo de painel, header (cor, altura, dentro/fora do painel), paleta de gradientes (cada cor = par topo→base, gradiente 90° sobre fundo branco), tags de components (ex.: `default-button` para hover/press).
- `surface(obj, paleta)` aplica o pacote padrão: gradiente + canto + borda + textura. Usar em tudo que é "bloco" do jogo para ficar consistente.
- Cor nova fora da paleta: `fill(obj, Color3)` gera o par (clareia topo, escurece base) — manter mesma intensidade das existentes.
- Botão principal de uma tela = cor de destaque (normalmente verde/dourado); secundário = cor neutra do perfil; perigo = vermelho. No máximo 2–3 cores de destaque por tela.

## Layout (variar conforme pedido)

Escolher o padrão pelo conteúdo, não repetir sempre o mesmo:
- **Painel modal**: header (título + close) + corpo com padding. Abas: faixa de botões horizontais no topo do corpo, um frame de conteúdo por aba no mesmo lugar.
- **Lista** (missões, ranking, log): `scroll` + `list` + `item` com ratio 5–7; ícone à esquerda, texto, ação à direita.
- **Grade** (loja, inventário): `scroll` + `grid` (cell em Scale, `FillDirectionMaxCells`) + cards quadrados/retrato; nome embaixo, preço/raridade em badge.
- **Card de destaque** (oferta, recompensa): retrato grande + título + descrição + botão; decoração atrás em `DECOR`.
- **Tabela** (stats): linha de cabeçalho + linhas `item` com colunas por Scale fixo (somam 1).
- **HUD**: moedas em pílulas no topo (ícone à esquerda + valor), menus em grade 2×N na lateral, ações principais embaixo no centro.
- **Popup de confirmação**: pequeno no centro, header, texto, 2 botões lado a lado simétricos (x = 0.29 / 0.71).
- **Toast/notificação**: faixa no topo central, some sozinha.

## A partir de imagem de referência

1. Medir a imagem: tamanho total; cada região como fração `x, y, w, h` da imagem → vira Scale direto. Proporção de cada caixa → `UIAspectRatioConstraint`.
2. Identificar componentes repetidos (viram `item` + layout) e hierarquia (o que é header, corpo, ação).
3. Cores, bordas e cantos: se o usuário pediu "nesse estilo", copiar da imagem; senão manter o perfil do jogo e copiar só o layout.
4. Construir, tirar screenshot e comparar lado a lado com a referência; ajustar proporções até bater.

## Ícones

- ID dado pelo usuário: `icon(parent, "Icon", "rbxassetid://ID", {...})`. Mesmo tamanho para ícones do mesmo grupo.
- Arquivo de imagem local: subir com `upload_image`/`store_image` e usar o ID retornado.
- "Coloque um ícone de X" sem ID: procurar primeiro nos ícones já usados no jogo (survey/dump); senão `search_asset` (imagens) e mostrar opções antes de usar.
- Ícone sempre transparente de fundo, `Fit`, `ratio 1`, z `ICON`. Nunca esticar.

## UI em código (Vide)

Se o usuário pedir a UI em código (`src/client/ui`), usar o mesmo perfil como tema (constantes de cor/stroke/canto num módulo de tema) e reproduzir a mesma árvore com componentes Vide. Seguir CLAUDE.md/ARCHITECTURE do projeto; estado vindo de atoms. Rodar `bun run check` e `bun run build`.

## Regras aprendidas (não repetir)

| Erro | Regra |
|---|---|
| Item com aspect e Size Y = 0 sumiu (tamanho 0) | `FitWithinMaxSize` precisa de caixa grande: Y = 100 Scale (`item`). |
| Lista centralizada num ScrollingFrame cortou o primeiro item | Lista vertical em scroll usa `VerticalAlignment = Top`. |
| Painel ligado para screenshot ficou visível | Toda mudança de `Visible` para foto é desfeita na mesma chamada seguinte, e conferida. |
| Borda grossa em painel grande (ScaledSize) | Espessura `ScaledSize` é proporcional ao objeto: painel usa `border(obj, ~0.4)`, header ~1.6, botão 1. Conferir na foto se bate com os botões do jogo. |
| Texto em `TextButton` sem stroke e fora do padrão | Texto sempre em `TextLabel` filho (`label`), botão vira `ImageButton` sem texto. |

## Perguntar só se necessário

Seguir o perfil e estes padrões. Perguntar apenas quando o conteúdo da tela é ambíguo (o que mostrar, quais ações) ou quando não dá para saber onde a UI deve ficar.
