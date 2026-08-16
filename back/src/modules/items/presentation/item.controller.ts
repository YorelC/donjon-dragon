import { Controller, Get, Inject } from '@nestjs/common';
import type { Item as ItemDto } from '@donjon-dragon/shared/item-schema';

import { ListItemsUseCase } from '../application/use-cases/list-items.use-case';

/**
 * Traduction HTTP seule. Aucun @UseGuards : le JwtAuthGuard est monté en
 * APP_GUARD dans app.module — le catalogue n'est pas public pour autant.
 */
@Controller('items')
export class ItemController {
  constructor(@Inject(ListItemsUseCase) private readonly list: ListItemsUseCase) {}

  @Get()
  async listItems(): Promise<ItemDto[]> {
    return this.list.execute();
  }
}
