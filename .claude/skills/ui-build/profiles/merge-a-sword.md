# Perfil UI — Merge a Sword (placeId 108484727112670)

Medido em 2026-10-06 (survey + dump + screenshots). Reconfirmar se o usuário mudar as UIs.

## Onde vivem as UIs

- `StarterGui.App` (ScreenGui): `IgnoreGuiInset = true`, `ZIndexBehavior = Sibling`, `ScreenInsets = DeviceSafeInsets`.
- `App.Background` (frame 1×1) com regiões: `Left` (grade 2×2 de menus), `Right` (Daily, 2x Rewards, Wheel), `Top` (pílulas Cash/Gems), `Low` (Buy Sword, Buy Max, Merge All, Auto Buy/Merge), `Mid` (contêiner dos painéis modais, todos `Visible = false`), `Announcements`, `Tutorial`, popups (`BossLeaveConfirm`, `HeroSpin`).
- Painel modal novo → filho de `App.Background.Mid`, `Visible = false`, anchor/pos 0.5, tamanho ~10.6×5.3 (Scale relativo ao `Mid`, que é 0.036×0.081 da tela).
- UIs são de Studio (não Vide). Comportamento por tag via Flamework components.

## Components por tag

- `default-button` (GuiButton): hover 1.07 / press 0.94 por mola, atributos `HoverScale`, `PressScale`. Todo botão novo recebe.
- `scaled-text`, `shiny` (painéis), `shiny-effect` (Configuration), `spiral` (decor girando), `left-panel-button`.

## Visual

- Fonte: `rbxassetid://16658221428` Bold, texto branco.
- Texto: stroke Contextual preto (ScaledSize ~0.06–0.1, ou Fixed 1.5–2.5 em labels de lista).
- Borda de bloco: **dupla** — `UIStroke` Border branco T=0.5 + `UIStroke` Border preto T=0, mesma espessura, `ScaledSize` (~0.025 em botão; ~0.0093 em painel; header 0.05).
- Fundo de bloco: `BackgroundColor3` + `UIGradient` 90° (topo claro → base escura). Ex.: botão Shop bg `#FF1A1A` com gradiente `#FFEBEB → #704343`.
- Textura: `BackgroundTexture` ImageLabel `rbxassetid://95489109754388`, Tile 400×200, T=0.7 (cards 0.8), com UICorner igual ao pai, z=1.
- Cantos: botões ~0.07–0.11 Scale; pílulas 0.175; header 0.157; **painel modal sem canto** (reto).
- Painel: bg `#424758` T=0.2, gradiente `#FFFFFF → #383C4A`, header **fora** do painel (pos y −0.145, altura 0.158, largura 1.01) com gradiente por painel (Shop vermelho `#FF0004 → #900A0A`, Settings verde), título centralizado, close X vermelho quadrado à direita (x 0.924).
- Gradientes da paleta (sobre fundo branco): verde `#63F050 → #128427` (botões de ação), dourado `#F0CD7D → #96692D`, vermelho `#EB553C → #5F140F`, azul `#46A0FF → #1446BE`, teal `#50AA96 → #144641`, claro `#F0F8FF → #96B4D2`, escuro `#FFFFFF → #383C4A`/`#5A6073`.
- Pílula de moeda: bg `#424758`, gradiente branco → `#383C4A`, ícone à esquerda (~0.19 da largura), valor alinhado à esquerda.
- Botão de menu: quadrado, ícone em cima (0.6, y 0.4), título embaixo (altura 0.23).

## Override do THEME (colar após ui-helpers)

```lua
THEME.PARENT = game:GetService("StarterGui")
THEME.FONT = Font.new("rbxassetid://16658221428", Enum.FontWeight.Bold)
THEME.TEXT_STROKE = { color = Color3.new(0, 0, 0), thickness = 0.08, transparency = 0, sizing = Enum.StrokeSizingMode.ScaledSize }
THEME.BORDER = {
	{ color = Color3.new(1, 1, 1), thickness = 0.025, transparency = 0.5 },
	{ color = Color3.new(0, 0, 0), thickness = 0.025, transparency = 0 },
}
THEME.CORNER = UDim.new(0.09, 0)
THEME.PANEL_CORNER = nil
THEME.TEXTURE = { image = "rbxassetid://95489109754388", transparency = 0.7, tile = UDim2.fromOffset(400, 200) }
THEME.PANEL = { color = Color3.fromHex("424758"), transparency = 0.2, top = Color3.new(1, 1, 1), bottom = Color3.fromHex("383C4A") }
THEME.HEADER = { height = 0.158, outside = true, palette = { Color3.fromHex("FF0004"), Color3.fromHex("900A0A") } }
THEME.PALETTE.red = { Color3.fromHex("EB553C"), Color3.fromHex("5F140F") }
THEME.PALETTE.green = { Color3.fromHex("63F050"), Color3.fromHex("128427") }
THEME.PALETTE.gold = { Color3.fromHex("F0CD7D"), Color3.fromHex("96692D") }
THEME.PALETTE.blue = { Color3.fromHex("46A0FF"), Color3.fromHex("1446BE") }
THEME.PALETTE.teal = { Color3.fromHex("50AA96"), Color3.fromHex("144641") }
THEME.PALETTE.light = { Color3.fromHex("F0F8FF"), Color3.fromHex("96B4D2") }
THEME.PALETTE.dark = { Color3.new(1, 1, 1), Color3.fromHex("5A6073") }
THEME.BUTTON_TAGS = { "default-button" }
THEME.PANEL_TAGS = { "shiny" }
```

`PANEL_CORNER = nil` deixa o painel reto (como os do jogo). Painel arredondado pontual: `panel(..., { radius = UDim.new(0.04, 0) })`.

## Ícones já usados

Cash `rbxassetid://101544073037389`, Shop `rbxassetid://134021002657688`. Rodar `ui-dump.luau` em `App.Background.Left`/`Right` para os demais.
