# Flamework Template (roblox-ts)

## Stack

- **Compiler & Tooling:** `roblox-ts`, `typescript`, `@rbxts/compiler-types`, `@rbxts/types`
- **Lint & Format:** `biome`
- **Framework:** `@flamework/core`, `@flamework/components`
- **Networking:** `@flamework/networking`, `@rbxts/tether`, `@rbxts/charm-sync`, `@rbxts/flamework-binary-serializer`
- **Data:** `@rbxts/profile-store`
- **State:** `@rbxts/charm`, `@rbxts/ripple`
- **UI:** `@rbxts/vide`, `@rbxts/vide-charm`, `@rbxts/vide-ripple`, `@rbxts/ui-labs`, `@rbxts/iris`, `@boshyxd/cool-transitions`
- **ECS:** `@rbxts/jecs`, `@rbxts/planck`
- **Cleanup:** `@rbxts/bin`, `@rbxts/trash`
- **Spatial Queries:** `@rbxts/quickzone`
- **Debug:** `@kyrorblx/konsole`
- **Utils:** `@rbxts/array-utils`, `@rbxts/object-utils`, `@rbxts/flamework-meta-utils`, `@rbxts/services`

## Scripts

```bash
bun run serve   # rojo serve
bun run build   # rbxtsc
bun run watch   # rbxtsc -w
bun run check   # biome check --write ./src
```
