export const PARAGON_PLATFORMS = ["PC", "Mobile", "Tablet", "Console", "VR"] as const;

export type ParagonPlatform = (typeof PARAGON_PLATFORMS)[number];
