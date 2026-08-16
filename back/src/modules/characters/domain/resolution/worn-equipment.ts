import type { DexterityAllowance } from '../reference/armors';

/**
 * Ce que le personnage porte, avec les statistiques déjà résolues.
 *
 * Le moteur ne va PAS les chercher : le catalogue d'objets vit dans une
 * collection, et le domaine ne fait pas d'I/O. C'est la couche application qui
 * les charge et les dépose ici.
 *
 * C'est ce qui permet à une armure inventée par un MJ d'entrer dans le calcul
 * de la classe d'armure au même titre qu'une armure du manuel : le moteur ne
 * sait pas d'où viennent ces nombres, et n'a pas à le savoir.
 */
export interface WornArmor {
  name: string;
  /** Pour un bouclier, c'est le bonus qu'il ajoute, pas une base. */
  baseArmorClass: number;
  dexterityAllowance: DexterityAllowance;
  stealthDisadvantage: boolean;
}

export interface WornEquipment {
  /** `null` quand le personnage ne porte rien : le moine et le barbare en vivent. */
  armor: WornArmor | null;
  shield: WornArmor | null;
}

export const NOTHING_WORN: WornEquipment = { armor: null, shield: null };
