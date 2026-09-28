import type { ItemType, ResolvedEquipment, ResolvedItem } from "@donjon-dragon/shared";

export interface GearCategory {
  label: string;
  items: ResolvedItem[];
}

/** L'ordre du Barda : ce qui frappe, ce qui protège, ce qui sert, le reste. */
const GEAR_CATEGORIES: readonly { label: string; types: readonly ItemType[] }[] = [
  { label: "Armes", types: ["weapon"] },
  { label: "Armures", types: ["armor"] },
  { label: "Outils", types: ["tool"] },
  { label: "Matériel", types: ["gear", "pack"] },
];

const WORN_TAG = "Porté";
const STEALTH_DISADVANTAGE_TAG = "Discrétion désavantagée";

/** Une catégorie vide ne s'affiche pas : un Barda sans outil ne dit pas « aucun outil ». */
export function toGearCategories(items: readonly ResolvedItem[]): GearCategory[] {
  return GEAR_CATEGORIES
    .map(({ label, types }) => ({ label, items: items.filter((item) => types.includes(item.type)) }))
    .filter((category) => category.items.length > 0);
}

/** Seule l'armure portée impose le désavantage : le bouclier, porté aussi, n'y est pour rien. */
export function toGearTag(item: ResolvedItem, equipment: ResolvedEquipment): string | undefined {
  if (!item.worn) return undefined;
  const isWornArmor = item.name === equipment.armorName;

  return isWornArmor && equipment.stealthDisadvantage
    ? `${WORN_TAG} · ${STEALTH_DISADVANTAGE_TAG}`
    : WORN_TAG;
}
