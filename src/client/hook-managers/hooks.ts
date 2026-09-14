export interface OnPreAnimation {
  onPreAnimation(dt: number): void;
}

export interface OnRenderStep {
  onRenderStep(dt: number): void;
}
