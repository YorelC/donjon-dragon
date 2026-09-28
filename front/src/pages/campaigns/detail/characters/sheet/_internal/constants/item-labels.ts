import type { ArmorStats, ItemType, WeaponStats } from "@donjon-dragon/shared";

type WeaponProperty = WeaponStats["properties"][number];
type WeaponMastery = NonNullable<WeaponStats["mastery"]>;

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  weapon: "Arme",
  armor: "Armure",
  gear: "Matériel",
  pack: "Paquetage",
  tool: "Outil",
};

export const ARMOR_KIND_LABELS: Record<ArmorStats["training"], string> = {
  light: "Armure légère",
  medium: "Armure intermédiaire",
  heavy: "Armure lourde",
  shields: "Bouclier",
};

export const WEAPON_CATEGORY_LABELS: Record<WeaponStats["category"], string> = {
  simple: "Arme courante",
  martial: "Arme de guerre",
};

export const WEAPON_KIND_LABELS: Record<WeaponStats["kind"], string> = {
  melee: "corps à corps",
  ranged: "à distance",
};

export const WEAPON_PROPERTY_LABELS: Record<WeaponProperty, string> = {
  ammunition: "Munitions",
  finesse: "Finesse",
  heavy: "Lourde",
  light: "Légère",
  loading: "Chargement",
  reach: "Allonge",
  thrown: "Lancer",
  twoHanded: "Deux mains",
  versatile: "Polyvalente",
};

/** Les bottes d'arme du PHB 2024, sous leur nom français. */
export const WEAPON_MASTERY_LABELS: Record<WeaponMastery, string> = {
  cleave: "Enchaînement",
  graze: "Écorchure",
  nick: "Entaille",
  push: "Poussée",
  sap: "Sape",
  slow: "Ralentissement",
  topple: "Renversement",
  vex: "Ouverture",
};
