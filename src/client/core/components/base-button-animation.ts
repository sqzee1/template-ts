import { BaseComponent } from '@flamework/components';
import type { OnStart } from '@flamework/core';
import { Bin } from '@rbxts/bin';

export default abstract class BaseButtonAnimation<A extends {} = {}, I extends GuiButton = GuiButton>
	extends BaseComponent<A, I>
	implements OnStart
{
	protected readonly includeClick: boolean = true;
	protected readonly bin = new Bin();
	protected hovered = false;

	protected abstract active?(): void;
	protected abstract inactive?(): void;

	public onStart(): void {
		this.bin.add(
			this.instance.MouseEnter.Connect(() => {
				this.hovered = true;
				this.active?.();
			}),
		);
		this.bin.add(
			this.instance.MouseLeave.Connect(() => {
				this.hovered = false;
				this.inactive?.();
			}),
		);
		if (this.includeClick) {
			this.bin.add(
				this.instance.MouseButton1Down.Connect(() => {
					this.hovered = false;
					this.inactive?.();
				}),
			);
			this.bin.add(
				this.instance.MouseButton1Up.Connect(() => {
					this.hovered = true;
					this.active?.();
				}),
			);
		}
	}
}
