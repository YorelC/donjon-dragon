import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

import { ItemController } from './item.controller';
import { ListItemsUseCase } from '../application/use-cases/list-items.use-case';
import { anItemSnapshot } from '../testing/item.fixture';

const mockUseCase = (): { execute: ReturnType<typeof vi.fn> } => ({
  execute: vi.fn(),
});

describe('ItemController — listItems', () => {
  let controller: ItemController;
  let listItems: ListItemsUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemController],
      providers: [{ provide: ListItemsUseCase, useValue: mockUseCase() }],
    }).compile();

    controller = module.get<ItemController>(ItemController);
    listItems = module.get<ListItemsUseCase>(ListItemsUseCase);
  });

  it('rend le catalogue tel que le use-case le produit', async () => {
    const catalog = [anItemSnapshot(), anItemSnapshot({ key: 'chain-mail', type: 'armor' })];
    vi.mocked(listItems.execute).mockResolvedValue(catalog);

    const result = await controller.listItems();

    expect(result).toEqual(catalog);
  });

  it('rend un tableau vide quand le catalogue est vide', async () => {
    vi.mocked(listItems.execute).mockResolvedValue([]);

    expect(await controller.listItems()).toEqual([]);
  });
});

// Le JwtAuthGuard est monté en APP_GUARD : la protection ne s'assert plus par
// la présence d'un @UseGuards, mais par l'ABSENCE de @Public().
describe('ItemController — protection des routes', () => {
  const ROUTES = ['listItems'] as const;

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ItemController)).toBeUndefined();
  });

  it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    const handler = ItemController.prototype[route];
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(ItemController.prototype).filter(
      (name) => name !== 'constructor',
    );
    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});
