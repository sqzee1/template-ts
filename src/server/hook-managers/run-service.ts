import { Modding, type OnStart, Service } from "@flamework/core";
import { RunService } from "@rbxts/services";
import type { OnPostSimulation, OnPreSimulation } from "shared/hooks";

@Service({})
export class RunServiceService implements OnStart {
  public onStart(): void {
    const preSimulationListeners = new Set<OnPreSimulation>();
    const postSimulationListeners = new Set<OnPostSimulation>();

    Modding.onListenerAdded<OnPreSimulation>((object) => preSimulationListeners.add(object));
    Modding.onListenerRemoved<OnPreSimulation>((object) => preSimulationListeners.delete(object));
    Modding.onListenerAdded<OnPostSimulation>((object) => postSimulationListeners.add(object));
    Modding.onListenerRemoved<OnPostSimulation>((object) => postSimulationListeners.delete(object));

    RunService.PreSimulation.Connect((dt) => {
      for (const listener of preSimulationListeners) listener.onPreSimulation(dt);
    });

    RunService.PostSimulation.Connect((dt) => {
      for (const listener of postSimulationListeners) listener.onPostSimulation(dt);
    });
  }
}
