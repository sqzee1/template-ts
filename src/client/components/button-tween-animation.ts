import type { OnStart } from "@flamework/core";

import BaseButtonAnimation from "./base-button-animation";

export default abstract class ButtonTweenAnimation<A extends {} = {}, I extends GuiButton = GuiButton>
  extends BaseButtonAnimation<A, I>
  implements OnStart
{
  protected abstract readonly tweenInfo: TweenInfo;

  protected abstract active?(): void;
  protected abstract inactive?(): void;

  public onStart(): void {
    super.onStart();
  }
}
