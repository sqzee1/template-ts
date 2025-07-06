import { Flamework } from "@flamework/core";

Flamework.addPaths("src/server/components");
Flamework.addPaths("src/server/services");
Flamework.addPaths("src/server/manager");
Flamework.addPaths("src/server/systems");
Flamework.addPaths("src/server/hooks-manager");
Flamework.addPaths("src/server/core");
Flamework.addPaths("src/shared/components");
Flamework.addPaths("src/shared/hooks");
Flamework.addPaths("src/shared/utils");

Flamework.ignite();
