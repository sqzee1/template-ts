import { Flamework } from "@flamework/core";
import { FlameworkIgnited } from "shared/constants/standard";

Flamework.addPaths("src/server/services");
Flamework.addPaths("src/server/hook-managers");
Flamework.addPaths("src/server/components");

Flamework.addPaths("src/shared/components");
Flamework.addPaths("src/shared/utils");

Flamework.ignite();
FlameworkIgnited.Fire();
