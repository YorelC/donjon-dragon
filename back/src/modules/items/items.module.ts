import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ITEM_REPOSITORY } from './application/ports/item.repository.port';
import { FindItemsByKeysUseCase } from './application/use-cases/find-items-by-keys.use-case';
import { ListItemsUseCase } from './application/use-cases/list-items.use-case';
import { ITEM_MODEL, ItemSchema } from './infrastructure/persistence/item.schema';
import { MongoItemRepository } from './infrastructure/persistence/mongo-item.repository';
import { ItemController } from './presentation/item.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: ITEM_MODEL, schema: ItemSchema }])],
  controllers: [ItemController],
  providers: [
    { provide: ITEM_REPOSITORY, useClass: MongoItemRepository },
    ListItemsUseCase,
    FindItemsByKeysUseCase,
  ],
  exports: [FindItemsByKeysUseCase],
})
export class ItemsModule {}
