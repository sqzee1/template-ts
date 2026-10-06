# Perfil Build — Merge a Sword (placeId 108484727112670)

Migrado da antiga skill de build do projeto. Reconfirmar com `survey.luau` (chão, limites, paleta) antes de usar.

## Estilo

```lua
useStyle("studs", { ROOT = "Changes" })
```

- `Plastic` (ou `SmoothPlastic` para metal/nuvem) + `MaterialVariant = "Studs"`. Sem variant: `Neon` (fogo, lâmpada, gema) e `Glass`.
- Tamanhos múltiplos de 0.25; peças planas alinhadas aos eixos.
- Linguagem de blocos: telhados em degraus, montanhas em terraços, copas em cubos. Sem cilindros/meshes.
- Paleta: madeira, pedra, telhado vermelho, verdes do mapa (tirar do survey).

## Mapa

- Pastas do jogo: `Map`, `Bases`, `Event` — nunca misturar. Build nova em `Workspace.Changes`.
- Ilha **quadrada**: limites por eixo.
- Oceano em tiles 2048, 3×3.
- `StreamingEnabled = true`: animação em `Script` `RunContext = Client` na pasta, modelos `Atomic`.

## Repintura por região do boss

`MapPaintController` (client) repinta `Map` e `Changes` quando o boss muda a região. Vegetação nova recebe atributo `PaintKind`:
- `terrain` — chão/grama plana, topos de grama.
- `leaf` — folhas, copas, arbustos, pinheiros, coqueiros.
- `grass` — caules, juncos, tufos, musgo.

Pedra, terra, neve, pétalas e construções não recebem.
