---
name: build
description: Constrói e decora mapas no Roblox Studio via MCP Roblox_Studio, em qualquer place e em qualquer estilo — studs/blocos, liso, low-poly, realista ou o padrão que o usuário pedir/mostrar em imagem. Tudo numa pasta própria, sem z-fighting, sem objetos enfiados em outros, apoiado corretamente, modelos organizados e verificados por checagens e screenshot. Use sempre que o usuário pedir para construir, decorar, modelar, adicionar props/estruturas/cenário, melhorar um mapa, criar ilhas, mar, vegetação, landmarks ou qualquer build no Studio.
---

# Build

Skill genérica para construir em qualquer mapa com `mcp__Roblox_Studio__execute_luau`. Nada aqui é de um jogo só: o que depende do mapa vem do **survey** e do **perfil**; o estilo vem do mapa ou do pedido.

Arquivos (colar o conteúdo no topo de cada `execute_luau`, cada chamada é isolada):
- [survey.luau](survey.luau) — mede o place: materiais, variants, grid de tamanhos, paleta, chão, água, limites, fonte, streaming.
- [helpers.luau](helpers.luau) — `STYLES` + `CONFIG` + funções (`part`, `stack`, `attach`, `findSpot`, `isFree`, `groundAt`, `record`...). Depois de colar: `useStyle("<estilo>", { overrides do perfil })`.
- [checks.luau](checks.luau) — z-fighting (corrige com `FIX_ZFIGHT = true`) e objetos atravessando outros. Ajustar `ROOT`/`SOFT`.
- `profiles/<place>.md` — perfil salvo de cada place.

## Fluxo

1. **Conectar**: `list_roblox_studios` → `studio_id` (confirmar o place pelo nome). `get_studio_state` em `Edit`.
2. **Perfil do mapa**: existe `profiles/<place>.md`? Reconfirmar rápido (chão/limites) e usar. Senão rodar `survey.luau`, investigar o que faltar (props típicos, áreas de gameplay, cantos livres) e salvar: estilo + overrides, paleta, zonas proibidas, zonas livres, pastas existentes, sistemas que mexem no mapa.
3. **Estilo**: por padrão o que o survey mostra. Pedido do usuário (outro estilo, imagem de referência, "igual a X") manda. Registrar no perfil se virar padrão.
4. **Pasta**: tudo novo em `CONFIG.ROOT` (padrão `Workspace.Changes` ou o nome pedido), uma subpasta/`Model` por tema, nomes claros (`Lighthouse`, `Lighthouse/Tower`, `Lighthouse/Lamp`). Não misturar com pastas do jogo. Tocar em algo existente: mínimo e **relatado**.
5. **Construir por tema**, cada chamada: helpers + `useStyle` no topo; `freshFolder` (idempotente); tudo em `record(label, fn)`; posição via `findSpot`/`isFree` contra `blockers()`; altura do chão com `groundAt`; empilhar com `stack`; peça presa em outra com `attach`.
6. **Verificar cada tema**: `checks.luau` → `zfight=0` e `crossings=0` (exceto contato intencional, justificado). Se z-fight: rodar com `FIX_ZFIGHT = true` e checar de novo. Depois `screen_capture` de perto e de longe (`camera_position`/`look_at_position`): flutuando? atravessando? proporção? cor fora da paleta?
7. **Relatar**: o que foi criado (pastas, contagem de peças e luzes), o que foi tocado fora, o que só dá pra ver em play.

## Estilos

| Estilo | Material / variant | Grid | Rotação | Formas |
|---|---|---|---|---|
| `studs` | `Plastic` + `"Studs"` (ou variant do mapa) | 0.25 | só 90° | só blocos; curvas viram degraus |
| `smooth` | `SmoothPlastic` | 0.25 | só 90° | blocos, wedge, cilindro |
| `lowpoly` | `SmoothPlastic`, cores chapadas | 0.05 | livre | wedges/corner wedges para facetas |
| `realistic` | material por peça (`Wood`, `Slate`, `Brick`, `Metal`...) | livre (0) | livre | todas; meshes só se pedido |
| custom | o que o usuário pedir/imagem mostrar | definir | definir | definir |

`useStyle("studs", { VARIANT = "MeuVariant", GRID = 0.5 })` ajusta. `part(..., { shape = "Wedge" })` falha em estilo só-blocos, a menos que `forceShape = true` (usuário pediu).

Regras de qualquer estilo:
- Cores da paleta do perfil (ou da referência). Variar tom só em volta das existentes.
- Decoração: `Anchored`, `CanTouch = false`, `CanQuery = false`. `CanCollide = true` só onde o jogador anda/esbarra.
- `CastShadow = false` em neon, nuvens, água, manchas de chão.
- Luz: `PointLight`/`SpotLight` com `Shadows = false`, contadas no relatório. Feixe com `Beam` (Width0 pequeno → Width1 grande, Transparency 0.45 → 1, LightEmission 1), nunca barra neon sólida.
- Neon só em detalhe pequeno. Superfície grande em cor clara normal (Bloom estoura).
- Texto em peça: fonte do perfil, `TextScaled`, `UIStroke`.
- Sem comentários em código Luau.

## Modelo correto

- **Apoio**: empilhar acumulando `y` (`stack`); cada peça no topo real da anterior. Nunca somar offsets à mão.
- **Base cobre o que está em cima**: calcular o bbox do que vai em cima; a base cobre bbox + margem.
- **Encaixe**: peça presa em outra via `attach` com o CFrame final da mãe. `+θ` em Z sobe a ponta +X.
- **Sem interpenetração** entre objetos diferentes (checks `crossings`). Dentro do mesmo modelo, encaixe intencional pode sobrepor, mas sem faces coplanares.
- **Organização**: `Model` por objeto com `PrimaryPart` quando fizer sentido mover; peças com nome do que são (`Roof`, `Door`, `Leaf`), não `Part`.

## Z-fighting (qualquer estilo)

Duas faces paralelas, na mesma posição (< 0.02) e sobrepostas piscam. Evitar na construção:
- Forma composta = faixas **disjuntas** ou alturas diferentes. Manchas não se encostam.
- Cruzamento de vigas/corrimões: uma peça 0.05 mais alta/baixa.
- Octógono de duas caixas giradas 45°: uma 0.1 mais baixa.
- Peça presa com a mesma espessura da base (bandeira = mastro): espessuras diferentes (0.15 vs 0.35).
- Terraços/lobos do mesmo nível: alturas distintas.
- Decal/textura/placa em parede: afastar ≥ 0.02 da face, ou usar `SurfaceGui`/`Decal` na própria peça.
- `checks.luau` trata peças como caixas: `Ball`/`Cylinder` ficam fora; topo inclinado de wedge pode dar falso positivo — confirmar na foto.

## Regras aprendidas (não repetir)

| Erro | Regra |
|---|---|
| Objeto dentro da área jogável por raio circular em mapa quadrado | Limites por eixo (`insideBounds`). |
| Prop atravessando parede de terraço | Aceitar só se o bbox (encolhido ~10%) não tocar nada; depois remover sobreposições entre os próprios props. |
| Query não enxergando peças | `GetPartBoundsInBox`/`GetPartsInPart`/raycast ignoram `CanQuery = false`: `withQuery` e restaurar. |
| Checagem acusando a própria construção | Comparar por objeto (modelo filho direto de pasta), não por peça. |
| Objeto animado dentro de outro na pose de edição | Pose de edição = primeiro ponto do caminho animado, fora de tudo. |
| `Random:NextBoolean` não existe | `rng:NextNumber() < 0.5`. |
| Peça gigante recusada / mar acabando no horizonte | Limite de 2048 por eixo: tiles (ex.: 3×3 de 2048). |
| Props do mapa atravessando piso novo | Mudar a posição da construção; mover prop existente só no mínimo e relatado. |

## Animação e streaming

- `workspace.StreamingEnabled` vem do survey.
- Animação decorativa: `Script` com `RunContext = Client` dentro da pasta da build.
- Com streaming: modelo animado `ModelStreamingMode = Atomic`; script registra modelos via `ChildAdded`/`ChildRemoved` e captura `GetPivot()` na chegada. Parâmetros em atributos (`Center`, `Radius`, `Speed`, `Phase`).

## Integração com sistemas do jogo

Antes de decorar chão/vegetação, procurar no código sistemas que alteram o mapa em runtime (bioma, região, evento, dia/noite): grep por `Map`, `Terrain`, `Color`, `Tween`, `palette`, `region`, `biome`. Se existir, fazer a construção nova entrar nele (atributo/tag/pasta que ele usa) e relatar. Registrar no perfil.

## Perguntar só se necessário

Seguir o perfil por padrão. Perguntar só quando tema, local ou estilo forem ambíguos e a escolha mudar muito o resultado.
