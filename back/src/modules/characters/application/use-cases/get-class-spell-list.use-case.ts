import { Injectable } from '@nestjs/common';
import type { CatalogSpellList } from '@donjon-dragon/shared/dnd-catalog-schema';

import type { ClassKey } from '../../domain/reference/keys';
import { spellsAvailableTo } from '../../domain/reference/spells';
import { toCatalogSpell } from '../dnd-catalog.mapper';

const CANTRIP_LEVEL = 0;

/**
 * Les sorts d'une classe au niveau 1, séparés en sorts mineurs et sorts de
 * niveau 1.
 *
 * Ils ne voyagent pas avec le catalogue : leurs descriptions pèsent lourd, et un
 * joueur qui crée un barbare n'en a aucun besoin. Une classe non lanceuse rend
 * deux listes vides — c'est une réponse, pas une erreur.
 */
@Injectable()
export class GetClassSpellListUseCase {
  execute(classKey: ClassKey): CatalogSpellList {
    const available = spellsAvailableTo(classKey).map(toCatalogSpell);

    return {
      classKey,
      cantrips: available.filter((spell) => spell.level === CANTRIP_LEVEL),
      level1: available.filter((spell) => spell.level !== CANTRIP_LEVEL),
    };
  }
}
