import Object from "@rbxts/object-utils";
import { randomItem } from "shared/utils/random-utils";

export const BasicColors = {
  White: Color3.fromRGB(255, 255, 255),
  Black: Color3.fromRGB(0, 0, 0),
  Red: Color3.fromRGB(255, 0, 0),
  Green: Color3.fromRGB(0, 255, 0),
  Blue: Color3.fromRGB(0, 0, 255),
  Yellow: Color3.fromRGB(255, 255, 0),
  Orange: Color3.fromRGB(255, 165, 0),
  Purple: Color3.fromRGB(128, 0, 128),
  Cyan: Color3.fromRGB(0, 255, 255),
  Magenta: Color3.fromRGB(255, 0, 255),
  Gray: Color3.fromRGB(128, 128, 128),
  DarkGray: Color3.fromRGB(64, 64, 64),
  LightGray: Color3.fromRGB(192, 192, 192),
} as const;

export const PastelColors = {
  Pink: Color3.fromRGB(255, 179, 186),
  Peach: Color3.fromRGB(255, 223, 186),
  Yellow: Color3.fromRGB(255, 255, 186),
  Green: Color3.fromRGB(186, 255, 201),
  Blue: Color3.fromRGB(186, 225, 255),
  Purple: Color3.fromRGB(216, 191, 216),
  Mint: Color3.fromRGB(189, 252, 201),
  Lavender: Color3.fromRGB(230, 230, 250),
  Coral: Color3.fromRGB(255, 204, 203),
  Sky: Color3.fromRGB(204, 229, 255),
} as const;

export const NeonColors = {
  Pink: Color3.fromRGB(255, 16, 240),
  Green: Color3.fromRGB(57, 255, 20),
  Blue: Color3.fromRGB(4, 217, 255),
  Yellow: Color3.fromRGB(255, 244, 79),
  Orange: Color3.fromRGB(255, 95, 31),
  Purple: Color3.fromRGB(191, 0, 255),
} as const;

export const EarthColors = {
  Sand: Color3.fromRGB(237, 201, 175),
  Clay: Color3.fromRGB(196, 120, 78),
  Moss: Color3.fromRGB(101, 122, 78),
  Bark: Color3.fromRGB(92, 64, 51),
  Stone: Color3.fromRGB(147, 145, 140),
  Olive: Color3.fromRGB(128, 128, 0),
} as const;

export type ColorPalette = Record<string, Color3>;

export function lightenColor(color: Color3, amount: number): Color3 {
  const [hue, saturation, value] = color.ToHSV();
  return Color3.fromHSV(hue, saturation, math.clamp(value + amount, 0, 1));
}

export function darkenColor(color: Color3, amount: number): Color3 {
  return lightenColor(color, -amount);
}

export function mixColors(from: Color3, to: Color3, alpha: number): Color3 {
  return from.Lerp(to, math.clamp(alpha, 0, 1));
}

export function colorToHex(color: Color3): string {
  return color.ToHex();
}

export function randomColorFrom(palette: ColorPalette): Color3 {
  return randomItem(Object.values(palette));
}
