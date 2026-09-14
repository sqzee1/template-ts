import { Controller, Modding, type OnStart } from "@flamework/core";
import { RunService } from "@rbxts/services";
import type { OnPreAnimation, OnRenderStep } from "client/hook-managers/hooks";
import type { OnPostSimulation, OnPreSimulation } from "shared/hooks";

const RENDER_STEP_NAME = "MovementPhysicsRenderStep";

@Controller({})
export class RunServiceController implements OnStart {
  public onStart(): void {
    const preAnimationListeners = new Set<OnPreAnimation>();
    const preSimulationListeners = new Set<OnPreSimulation>();
    const postSimulationListeners = new Set<OnPostSimulation>();
    const renderStepListeners = new Set<OnRenderStep>();

    Modding.onListenerAdded<OnPreAnimation>((object) => preAnimationListeners.add(object));
    Modding.onListenerRemoved<OnPreAnimation>((object) => preAnimationListeners.delete(object));
    Modding.onListenerAdded<OnPreSimulation>((object) => preSimulationListeners.add(object));
    Modding.onListenerRemoved<OnPreSimulation>((object) => preSimulationListeners.delete(object));
    Modding.onListenerAdded<OnPostSimulation>((object) => postSimulationListeners.add(object));
    Modding.onListenerRemoved<OnPostSimulation>((object) => postSimulationListeners.delete(object));
    Modding.onListenerAdded<OnRenderStep>((object) => renderStepListeners.add(object));
    Modding.onListenerRemoved<OnRenderStep>((object) => renderStepListeners.delete(object));

    RunService.PreAnimation.Connect((dt) => {
      for (const listener of preAnimationListeners) listener.onPreAnimation(dt);
    });

    RunService.PreSimulation.Connect((dt) => {
      for (const listener of preSimulationListeners) listener.onPreSimulation(dt);
    });

    RunService.PostSimulation.Connect((dt) => {
      for (const listener of postSimulationListeners) listener.onPostSimulation(dt);
    });

    RunService.BindToRenderStep(RENDER_STEP_NAME, Enum.RenderPriority.Last.Value, (dt) => {
      for (const listener of renderStepListeners) listener.onRenderStep(dt);
    });
  }
}
