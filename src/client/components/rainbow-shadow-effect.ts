import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Bin } from "@rbxts/bin";
import { RunService } from "@rbxts/services";

interface Attributes {}

@Component({ tag: "rainbow-shadow" })
export class RainbowShadowEffect extends BaseComponent<Attributes, GuiObject> implements OnStart {
  private readonly bin = new Bin();
  private readonly effectBin = new Bin();
  private shadows: UIShadow[] = [];
  private SPEED = 5 as const;

  private onVisibleChanged = () => {
    if (this.instance.Visible) {
      this.startRainbow();
    } else {
      this.stopRainbow();
    }
  };

  private collectShadows() {
    this.shadows = this.instance
      .GetDescendants()
      .filter((inst): inst is UIShadow => inst.IsA("UIShadow") && inst.Name === "RainbowEffect");
  }

  private startRainbow() {
    if (!this.effectBin.isEmpty()) return;
    this.collectShadows();

    this.effectBin.add(
      RunService.Heartbeat.Connect(() => {
        const color = Color3.fromHSV((os.clock() / this.SPEED) % 1, 1, 1);
        for (const shadow of this.shadows) {
          shadow.Color = color;
        }
      }),
    );
  }

  private stopRainbow() {
    this.effectBin.destroy();
    this.shadows.clear();
  }

  onStart() {
    this.bin.add(this.instance.GetPropertyChangedSignal("Visible").Connect(this.onVisibleChanged));
    this.onVisibleChanged();
  }

  destroy(): void {
    this.bin.destroy();
    this.effectBin.destroy();
    super.destroy();
  }
}
