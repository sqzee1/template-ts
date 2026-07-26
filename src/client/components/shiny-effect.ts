import { BaseComponent, Component } from "@flamework/components";
import { OnStart } from "@flamework/core";
import { Bin } from "@rbxts/bin";
import { CollectionService, TweenService } from "@rbxts/services";

const SHINY_EFFECT_TAG = "shiny-effect";

interface Attributes {}

@Component({ tag: "shiny" })
export class UIShiny extends BaseComponent<Attributes, GuiObject> implements OnStart {
  private readonly bin = new Bin();
  private readonly effectBin = new Bin();
  private SHINE_IMAGE = "rbxassetid://71904840558679" as const;
  private TWEEN_INFO = new TweenInfo(1, Enum.EasingStyle.Circular, Enum.EasingDirection.In, -1, false);

  private onVisibleChanged = () => {
    if (this.instance.Visible) {
      this.startShiny();
    } else {
      this.stopShiny();
    }
  };

  private collectTargets() {
    const targets: (ImageLabel | Frame | ImageButton | TextButton)[] = [];

    for (const inst of this.instance.GetDescendants()) {
      if (!inst.IsA("Configuration") || !CollectionService.HasTag(inst, SHINY_EFFECT_TAG)) continue;

      const gear = inst.Parent;
      if (gear && (gear.IsA("ImageLabel") || gear.IsA("Frame") || gear.IsA("ImageButton") || gear.IsA("TextButton"))) {
        targets.push(gear);
      }
    }

    return targets;
  }

  private startShiny() {
    if (!this.effectBin.isEmpty()) return;

    for (const target of this.collectTargets()) {
      const shine = new Instance("ImageLabel");
      shine.Name = "Shine";
      shine.ZIndex = -1;
      shine.Size = UDim2.fromScale(1, 1);
      shine.BackgroundTransparency = 1;
      shine.Image = this.SHINE_IMAGE;
      shine.AnchorPoint = new Vector2(0.5, 0.5);
      shine.Position = UDim2.fromScale(-0.5, 0.5);
      shine.Parent = target;

      const tween = TweenService.Create(shine, this.TWEEN_INFO, { Position: UDim2.fromScale(1.5, 0.5) });
      tween.Play();

      this.effectBin.add(shine);
      this.effectBin.add(tween);
    }
  }

  private stopShiny() {
    this.effectBin.destroy();
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
