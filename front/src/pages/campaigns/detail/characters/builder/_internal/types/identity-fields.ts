import type { Alignment, CatalogPhysicalBounds, CatalogMeasurementRange } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";

/**
 * L'état civil, une fois qu'il est complet.
 *
 * Le contrat de création exige ces cinq champs ; la composition les tient
 * nullables tant que le joueur n'a pas atteint la dernière étape. Ce type est
 * le pont entre les deux, et il n'est obtenu que par `completeIdentityOf` —
 * jamais par un cast.
 */
export interface CompleteIdentity {
  name: string;
  alignment: Alignment;
  age: number;
  heightCm: number;
  weightKg: number;
  description: string | null;
}

/**
 * Rétrécissement typé plutôt qu'affirmation : tant qu'un champ manque, il n'y a
 * pas d'identité, et le payload de création vaut `null`. La description reste
 * facultative, le contrat ne l'exige pas.
 *
 * Cette garde couvre la PRÉSENCE, pas toutes les contraintes du schéma partagé —
 * les bornes du nom, par exemple, restent celles de l'étape. C'est le serveur
 * qui tranche en dernier, et c'est très bien ainsi.
 */
export function completeIdentityOf(
  composition: CharacterComposition,
  bounds: CatalogPhysicalBounds | undefined,
): CompleteIdentity | null {
  const { name, alignment, age, heightCm, weightKg, description } = composition;
  if (!name.trim() || !alignment) return null;
  if (age === null || heightCm === null || weightKg === null) return null;
  if (!bounds || !inRange(heightCm, bounds.heightCm)) return null;
  if (!inRange(weightKg, bounds.weightKg)) return null;

  return { name, alignment, age, heightCm, weightKg, description };
}

function inRange(value: number, range: CatalogMeasurementRange): boolean {
  return value >= range.min && value <= range.max;
}

/** DEC-008 : le milieu de la plage de l'espèce, arrondi à l'entier inférieur. */
export function defaultMeasurementOf(range: CatalogMeasurementRange): number {
  return Math.floor((range.min + range.max) / 2);
}

export function defaultMeasurementsOf(
  bounds: CatalogPhysicalBounds,
): Pick<CharacterComposition, "heightCm" | "weightKg"> {
  return {
    heightCm: defaultMeasurementOf(bounds.heightCm),
    weightKg: defaultMeasurementOf(bounds.weightKg),
  };
}

/**
 * Un champ numérique HTML rend une chaîne, y compris quand il est vide.
 *
 * `Number("")` vaut zéro et `Number("abc")` vaut `NaN` : les deux passeraient
 * pour des valeurs. Rien d'invalide n'entre donc dans la composition — c'est
 * `null` qui dit « pas encore saisi », et l'étape reste invalide.
 *
 * Aucune borne d'espèce ici : la frappe passe par des valeurs intermédiaires
 * hors bornes (« 1 » avant « 175 »), et les refuser viderait le champ. Les
 * bornes se vérifient sur la valeur complète, dans `completeIdentityOf`.
 */
export function positiveNumberFieldValue(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);

  return Number.isFinite(value) && value > 0 ? value : null;
}

/** L'âge se compte en années entières, contrairement à la taille et au poids. */
export function positiveIntegerFieldValue(raw: string): number | null {
  const value = positiveNumberFieldValue(raw);

  return value !== null && Number.isInteger(value) ? value : null;
}
