import { Injectable } from '@nestjs/common';
import type { DndCatalog } from '@donjon-dragon/shared/dnd-catalog-schema';

import { toDndCatalog } from '../dnd-catalog.mapper';

/**
 * Le catalogue que le wizard de création affiche : espèces, classes,
 * historiques, dons d'Origines et armures.
 *
 * Aucune dépendance à injecter — les données de référence sont des constantes du
 * domaine, pas des documents Mongo. Ce use-case existe quand même : un
 * controller appelle un use-case, jamais le domaine directement.
 */
@Injectable()
export class GetDndCatalogUseCase {
  execute(): DndCatalog {
    return toDndCatalog();
  }
}
