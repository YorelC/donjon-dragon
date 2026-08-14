import type { PreviewCharacterSheetDto } from '@donjon-dragon/shared/character-schema';

import type { CharacterBuildDraft } from '../domain/character';

/**
 * Contrat HTTP → domaine. Les deux formes se ressemblent, mais elles ne sont pas
 * la même chose : Zod a garanti que les clés existent dans le vocabulaire, pas
 * que les choix tiennent la route. C'est l'agrégat qui tranche ensuite.
 */
export function toBuildDraft(body: PreviewCharacterSheetDto): CharacterBuildDraft {
  return {
    speciesKey: body.speciesKey,
    lineageKey: body.lineageKey,
    classKey: body.classKey,
    backgroundKey: body.backgroundKey,
    abilityMethod: body.abilityMethod,
    base: body.base,
    backgroundBonuses: body.backgroundBonuses,
    choices: body.choices,
    equipment: body.equipment,
  };
}
