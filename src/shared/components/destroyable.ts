import { BaseComponent, Component, Components } from "@flamework/components";
import { Constructor, getIdFromSpecifier } from "@flamework/components/out/utility";
import { Dependency } from "@flamework/core";
import { Bin } from "@rbxts/bin";

@Component({})
export default class Destroyable<A = {}, I extends Instance = Instance> extends BaseComponent<A, I> {
  protected readonly bin = new Bin();

  public destroy(): void {
    if (this.bin === undefined || !("destroy" in this.bin)) return;

    const components = Dependency<Components>();
    const id = getIdFromSpecifier(getmetatable(this) as Constructor);

    this.bin.destroy();
    components.removeComponent(this.instance, id);
  }
}
