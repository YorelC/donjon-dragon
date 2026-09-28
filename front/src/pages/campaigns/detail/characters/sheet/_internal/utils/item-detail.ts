import type {
  ArmorStats,
  ResolvedItem,
  ResolvedItemDetail,
  WeaponStats,
} from "@donjon-dragon/shared";
import {
  ARMOR_KIND_LABELS,
  ITEM_TYPE_LABELS,
  WEAPON_CATEGORY_LABELS,
  WEAPON_KIND_LABELS,
  WEAPON_MASTERY_LABELS,
  WEAPON_PROPERTY_LABELS,
} from "../constants/item-labels";
import { DAMAGE_TYPE_LABELS } from "../constants/sheet-labels";
import { fact, type DetailFact } from "../types/detail-fact";
import { toLabel, toLabelList } from "./sheet-format";

const FRENCH_LOCALE = "fr-FR";
const COPPER_PER_GOLD = 100;
const COPPER_PER_SILVER = 10;
/** L'armure intermédiaire plafonne la Dextérité à +2 (PHB 2024). */
const MEDIUM_ARMOR_DEX_CAP = 2;
const UNKNOWN = "—";
const VARIABLE_COST = "Variable";
const MELEE_RANGE = "Corps à corps";

/** « Arme de guerre · corps à corps », « Armure légère », « Matériel ». */
export function toItemKicker(item: ResolvedItem): string {
  const weapon = item.detail?.weapon;
  if (weapon) return `${WEAPON_CATEGORY_LABELS[weapon.category]} · ${WEAPON_KIND_LABELS[weapon.kind]}`;
  const armor = item.detail?.armor;

  return armor ? ARMOR_KIND_LABELS[armor.training] : ITEM_TYPE_LABELS[item.type];
}

/** Ce que l'arme ou l'armure change au jeu, puis poids et prix pour tout objet. */
export function toItemFacts(detail: ResolvedItemDetail): DetailFact[] {
  const weapon = detail.weapon ? toWeaponFacts(detail.weapon) : [];
  const armor = detail.armor ? toArmorFacts(detail.armor) : [];
  const common = [
    fact("Poids", toWeight(detail.weightInKg)),
    fact("Prix", toCost(detail.costInCopper)),
  ];

  return [...weapon, ...armor, ...common];
}

function toWeaponFacts(weapon: WeaponStats): DetailFact[] {
  const facts = [fact("Dégâts", toDamage(weapon)), fact("Portée", toRange(weapon))];
  const properties = toLabelList(WEAPON_PROPERTY_LABELS, weapon.properties);
  const withProperties = properties ? [...facts, fact("Propriétés", properties)] : facts;

  return weapon.mastery
    ? [...withProperties, fact("Botte", WEAPON_MASTERY_LABELS[weapon.mastery])]
    : withProperties;
}

function toArmorFacts(armor: ArmorStats): DetailFact[] {
  const strength = armor.strengthRequirement
    ? [fact("Force requise", String(armor.strengthRequirement))]
    : [];
  const stealth = armor.stealthDisadvantage ? [fact("Discrétion", "Désavantage")] : [];

  return [fact("Classe d'armure", toArmorClass(armor)), ...strength, ...stealth];
}

function toDamage(weapon: WeaponStats): string {
  const damage = `${weapon.damageDice} ${toLabel<string>(DAMAGE_TYPE_LABELS, weapon.damageType)}`;
  return weapon.versatileDice ? `${damage} (${weapon.versatileDice} à deux mains)` : damage;
}

function toRange({ range }: WeaponStats): string {
  return range ? `${range.normal} / ${range.max} m` : MELEE_RANGE;
}

/** Le bouclier s'ajoute ; une armure remplace la base, plus ce qu'elle laisse de Dextérité. */
function toArmorClass(armor: ArmorStats): string {
  if (armor.training === "shields") return `+${armor.baseArmorClass}`;
  const byAllowance: Record<ArmorStats["dexterityAllowance"], () => string> = {
    full: () => `${armor.baseArmorClass} + mod. Dex`,
    capped: () => `${armor.baseArmorClass} + mod. Dex (max ${MEDIUM_ARMOR_DEX_CAP})`,
    none: () => String(armor.baseArmorClass),
  };

  return byAllowance[armor.dexterityAllowance]();
}

function toWeight(weightInKg: number | null): string {
  return weightInKg === null ? UNKNOWN : `${weightInKg.toLocaleString(FRENCH_LOCALE)} kg`;
}

/** Le prix dans la plus grosse pièce qui le dit sans fraction : 2 500 pc s'écrivent « 25 po ». */
function toCost(costInCopper: number | null): string {
  if (costInCopper === null) return VARIABLE_COST;
  if (costInCopper % COPPER_PER_GOLD === 0) return `${costInCopper / COPPER_PER_GOLD} po`;
  if (costInCopper % COPPER_PER_SILVER === 0) return `${costInCopper / COPPER_PER_SILVER} pa`;
  return `${costInCopper} pc`;
}
