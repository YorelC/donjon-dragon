import { Inject, Injectable } from '@nestjs/common';
import type { Item as ItemDto } from '@donjon-dragon/shared/item-schema';

import { ITEM_REPOSITORY, type ItemRepositoryPort } from '../ports/item.repository.port';
import { toItemDto } from '../item.mapper';

/**
 * Le catalogue du manuel, en un seul appel. Il ne change qu'à une errata : le
 * front le charge une fois et le garde, comme le catalogue de référence D&D.
 */
@Injectable()
export class ListItemsUseCase {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly items: ItemRepositoryPort,
  ) {}

  async execute(): Promise<ItemDto[]> {
    const items = await this.items.findReferenceItems();
    return items.map(toItemDto);
  }
}
