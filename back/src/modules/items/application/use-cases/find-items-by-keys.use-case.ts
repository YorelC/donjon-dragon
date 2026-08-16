import { Inject, Injectable } from '@nestjs/common';
import type { Item as ItemDto } from '@donjon-dragon/shared/item-schema';

import { ITEM_REPOSITORY, type ItemRepositoryPort } from '../ports/item.repository.port';
import { toItemDto } from '../item.mapper';
import { ItemKey } from '../../domain/item-key';

export interface FindItemsByKeysDto {
  keys: string[];
  /** `null` pour n'interroger que le manuel. */
  campaignId: string | null;
}

/**
 * Résout des clés en objets. Rend ce qu'il trouve, sans se plaindre de ce qui
 * manque : c'est à l'appelant de décider si une clé inconnue est une faute —
 * refuser un personnage à la création, ou seulement ne rien afficher.
 */
@Injectable()
export class FindItemsByKeysUseCase {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly items: ItemRepositoryPort,
  ) {}

  async execute(dto: FindItemsByKeysDto): Promise<ItemDto[]> {
    if (dto.keys.length === 0) return [];
    const keys = dto.keys.map((key) => ItemKey.create(key));
    const found = await this.items.findManyByKeys(keys, dto.campaignId);
    return found.map(toItemDto);
  }
}
