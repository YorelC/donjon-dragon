/** Les clés de ressource que le moteur expose, et que la fiche sait illustrer. */
export const RESOURCE_KEYS = {
  bardicInspiration: "bardicInspiration",
  secondWind: "secondWind",
  rage: "rageUses",
} as const;

export type IllustratedResource = (typeof RESOURCE_KEYS)[keyof typeof RESOURCE_KEYS];

/** La teinte de chaque ressource illustrée ; les autres gardent l'or de la charte. */
export const RESOURCE_TONES: Record<IllustratedResource, string> = {
  [RESOURCE_KEYS.bardicInspiration]: "text-resource-bard",
  [RESOURCE_KEYS.secondWind]: "text-resource-fighter",
  [RESOURCE_KEYS.rage]: "text-resource-rage",
};

export const DEFAULT_RESOURCE_TONE = "text-gold";

export function isIllustratedResource(key: string): key is IllustratedResource {
  return key in RESOURCE_TONES;
}

export function resourceToneOf(key: string): string {
  return isIllustratedResource(key) ? RESOURCE_TONES[key] : DEFAULT_RESOURCE_TONE;
}
