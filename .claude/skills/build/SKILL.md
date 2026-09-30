---
name: studs-build
description: Constrói e decora o mapa no Roblox Studio (via MCP Roblox_Studio) no estilo do jogo — peças em blocos com MaterialVariant "Studs", tamanhos múltiplos de 0.25 stud, tudo numa pasta própria, sem z-fighting, sem objetos enfiados em outros e verificado por screenshot. Use sempre que o usuário pedir para construir, decorar, adicionar props/estruturas/cenário, melhorar o mapa, ilhas, mar, vegetação ou qualquer build no Studio.
---

# Studs Build

Builds feitos direto no Studio com `mcp__Roblox_Studio__execute_luau`, seguindo o padrão visual do mapa e evitando os erros já cometidos.

## Fluxo obrigatório

1. **Conectar**: `list_roblox_studios` → pegar `studio_id`. `get_studio_state` deve estar em `Edit`.
2. **Medir antes de construir** (nunca chutar):
   - Estilo: contar `Material`/`MaterialVariant` das peças do mapa, paleta de cores dos props existentes, fonte dos textos (`FontFace`).
   - Geometria: limites da ilha, Y do chão, Y da água, footprint de cada base/ponte/arena, props existentes.
   - Valores atuais conhecidos em [reference.md](reference.md) — reconfirmar se o mapa mudou.
3. **Pasta de destino**: tudo novo vai em `Workspace.Changes` (ou a pasta que o usuário pedir), uma subpasta/modelo por tema. Nunca misturar com `Map`, `Bases`, `Event`. Se for inevitável tocar em algo existente (ex.: tufo atravessando piso), fazer o mínimo e **relatar**.
4. **Cada chamada idempotente**: destruir a subpasta do tema e recriar. Envolver em `ChangeHistoryService:TryBeginRecording/FinishRecording` (Ctrl+Z funciona). Cada `execute_luau` é isolado: colar o preâmbulo de [helpers.luau](helpers.luau) no topo.
5. **Posicionar com checagem**: achar espaço livre com `findSpot`/`isFree` contra Bases, Event, props do Map e o que já existe em Changes.
6. **Verificar** depois de cada tema:
   - [checks.luau](checks.luau) → z-fighting (tem que dar 0) e intersecção entre objetos (tem que dar 0, exceto contatos intencionais).
   - `screen_capture` com `camera_position` + `look_at_position` apontando pro que foi construído. Olhar de verdade: flutuando? atravessando? proporção?
7. **Relatar**: o que foi criado (subpastas, contagem de peças/luzes), o que foi tocado fora da pasta, o que não deu pra verificar (animação/partículas só rodam em play).

## Regras de estilo

- `Material = Plastic` (ou `SmoothPlastic` para metal/nuvem) com `MaterialVariant = "Studs"`. Exceções: `Neon` (brilho: fogo, lâmpadas, gemas) e `Glass` — sem variant.
- Tamanhos e posições em múltiplos de **0.25**. Peças planas no chão alinhadas aos eixos (sem rotação quebrada) para os studs baterem.
- Visual de blocos: formas escalonadas (telhados em degraus, montanhas em terraços, copas em cubos). Nada de cilindros/meshes novos.
- Paleta coerente com o mapa (ver reference.md). Madeira, pedra, telhado vermelho, verdes do mapa.
- Decoração: `CanTouch = false`, `CanQuery = false`, `Anchored = true`. `CanCollide = true` só em estruturas onde o jogador anda/esbarra perto; tudo longe ou pequeno (flores, manchas, nuvens, mar) `false`.
- `CastShadow = false` em neon, nuvens, água, manchas de chão.
- Luzes: `PointLight`/`SpotLight` com `Shadows = false`, poucas (relatar total). Feixes de luz com `Beam` (Width0→Width1, Transparency 0.45→1, LightEmission 1), nunca barra neon sólida.
- Textos em peça: `SurfaceGui`/`BillboardGui` com a fonte do jogo, `TextScaled`, `UIStroke`.
- Sem comentários em código Luau (regra do usuário).

## Erros já cometidos — nunca repetir

| Erro | Regra |
|---|---|
| Z-fighting em manchas feitas de retângulos sobrepostos na mesma altura | Formas compostas = faixas **disjuntas** (sem sobreposição), ou alturas diferentes. Uma mancha não pode encostar em outra. |
| Corrimões/vigas cruzando nos cantos com topo coplanar | Em cruzamentos, uma das peças 0.05 mais alta/baixa. |
| Duas caixas iguais giradas 45° (octógono) com topo coplanar | Uma delas 0.1 mais baixa. |
| Peça fina com mesma espessura da vizinha (bandeira = mastro) | Peça presa deve ser mais fina ou mais grossa que a base (ex.: 0.15 vs 0.35). |
| Lobos/terraços do mesmo nível com a mesma altura | Alturas distintas por lobo (`h - k*1.5`), shores com topos diferentes (`-k*0.25`). |
| Farol flutuando 1 stud acima das pedras | Empilhar acumulando `y += altura` e apoiar cada peça exatamente no topo da de baixo. Nunca somar offsets à mão. |
| Casinha saindo da base do farol | Calcular o bbox de tudo que vai em cima e fazer a base cobrir esse bbox + margem. |
| Farol/boias dentro da ilha por usar raio circular | A ilha é **quadrada**: testar `abs(dx)` e `abs(dz)` por eixo (`outsideIsland`). Diagonal chega a ~√2·metade. |
| Árvores dentro das paredes dos terraços | Só aceitar a árvore se o bbox da copa (encolhido 10%) não tocar nenhuma peça da ilha; depois remover árvores que se sobrepõem entre si. |
| Queries não enxergando peças | `GetPartBoundsInBox`/`GetPartsInPart` ignoram `CanQuery = false`: ligar temporariamente (`withQuery`) e restaurar. |
| Peças da própria construção entrando na checagem | Filtrar pelo objeto (modelo filho direto de pasta), não pela peça. |
| Pontas das asas soltas (rotação aplicada no centro errado) | Peça presa na ponta de outra: `child.CFrame = parent.CFrame * CFrame.new(offset)` usando o CFrame final da mãe. Sinal de rotação: `+θ` em Z sobe a ponta **+X**. |
| Gaivotas dentro das ilhas na posição inicial | Posição inicial de edição = primeiro ponto do caminho animado, fora de tudo. |
| `Random:NextBoolean` não existe | Usar `rng:NextNumber() < 0.5`. |
| Mar terminando no horizonte | Oceano em tiles de 2048 (limite de tamanho de peça), 3×3. |
| Neon forte estourando no Bloom | Neon só em detalhes pequenos; superfícies grandes em SmoothPlastic claro. |

## Animação e streaming

- O place usa **StreamingEnabled**. Animação em `Script` com `RunContext = Client` dentro da pasta (roda só no cliente).
- Todo modelo animado: `ModelStreamingMode = Atomic`.
- O script registra modelos por `ChildAdded`/`ChildRemoved` do contêiner e captura `GetPivot()` na chegada. Nunca capturar tudo uma vez no início.
- Guardar parâmetros por modelo em atributos (`Center`, `Radius`, `Speed`, `Phase`).

## Região do boss (repintura)

`MapPaintController` (`src/client/controllers/map.ts`) repinta `Map` e `Changes` quando o boss muda a região. Toda vegetação nova recebe atributo `PaintKind`:
- `terrain` — chão/grama plana, topos de grama.
- `leaf` — folhas, copas, arbustos, pinheiros, coqueiros.
- `grass` — caules, juncos, tufos, musgo.
Pedra, terra, neve, pétalas e construções não recebem.

## Perguntar só se necessário

Seguir o padrão acima por padrão. Perguntar ao usuário apenas quando o pedido deixa um tema/local ambíguo e as escolhas mudam muito o resultado.
