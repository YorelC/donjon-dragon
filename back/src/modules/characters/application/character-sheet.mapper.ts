import type { ComputedCharacter as CharacterSheetDto } from '@donjon-dragon/shared/character-sheet-schema';

import type { ComputedCharacter } from '../domain/resolution/resolve-sheet';

/**
 * La fiche calculée, telle qu'elle sort vers le HTTP.
 *
 * Le domaine et le contrat partagé décrivent la même forme sans se connaître :
 * le domaine ne lit de `@donjon-dragon/shared` que `error-schema`. Ce mapper est
 * l'endroit où les deux se rencontrent, et `character-sheet.mapper.test.ts`
 * vérifie qu'ils disent bien la même chose en faisant passer une fiche réelle
 * par le schéma Zod.
 *
 * Il copie plutôt qu'il ne renvoie la référence : rien de ce que le domaine a
 * produit ne doit pouvoir être modifié depuis la couche HTTP.
 */
export function toCharacterSheetDto(sheet: ComputedCharacter): CharacterSheetDto {
  return {
    ...sheet,
    maxHitPoints: { ...sheet.maxHitPoints, sources: [...sheet.maxHitPoints.sources] },
    armorClass: { ...sheet.armorClass, sources: [...sheet.armorClass.sources] },
    initiative: { ...sheet.initiative, sources: [...sheet.initiative.sources] },
    speed: { ...sheet.speed, sources: [...sheet.speed.sources] },
    skills: sheet.skills.map((skill) => ({ ...skill })),
    proficiencies: { ...sheet.proficiencies },
    spellcasting: sheet.spellcasting.map((entry) => ({ ...entry })),
    features: sheet.features.map((feature) => ({ ...feature })),
    resources: sheet.resources.map((resource) => ({ ...resource })),
  };
}
