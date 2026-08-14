import { Controller, Get, Inject } from '@nestjs/common';
import {
  ClassKeySchema,
  type ClassKey,
} from '@donjon-dragon/shared/dnd-reference-schema';

import { ZodParam } from '@common/decorators/zod-validated.decorator';
import { GetClassSpellListUseCase } from '../application/use-cases/get-class-spell-list.use-case';
import { GetDndCatalogUseCase } from '../application/use-cases/get-dnd-catalog.use-case';

/**
 * Les données de référence D&D 2024, telles que le wizard de création les
 * affiche.
 *
 * Hors de `/campaigns/:campaignId/characters` : ce catalogue ne dépend d'aucune
 * campagne, il est le même pour tout le monde. Mais il reste derrière le jeton —
 * aucun @Public() ici, comme partout ailleurs.
 */
@Controller('dnd')
export class DndCatalogController {
  constructor(
    @Inject(GetDndCatalogUseCase) private catalog: GetDndCatalogUseCase,
    @Inject(GetClassSpellListUseCase) private spells: GetClassSpellListUseCase,
  ) {}

  @Get('catalog')
  getCatalog() {
    return this.catalog.execute();
  }

  @Get('spells/:classKey')
  getClassSpells(@ZodParam('classKey', ClassKeySchema) classKey: ClassKey) {
    return this.spells.execute(classKey);
  }
}
