import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

import { BestiaryController } from './bestiary.controller';
import { FindMonsterByKeyUseCase } from '../application/use-cases/find-monster-by-key.use-case';
import { ListBestiaryUseCase } from '../application/use-cases/list-bestiary.use-case';
import { aMonsterSnapshot } from '../testing/monster.fixture';

const mockUseCase = (): { execute: ReturnType<typeof vi.fn> } => ({
  execute: vi.fn(),
});

describe('BestiaryController', () => {
  let controller: BestiaryController;
  let listBestiary: ListBestiaryUseCase;
  let findMonster: FindMonsterByKeyUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BestiaryController],
      providers: [
        { provide: ListBestiaryUseCase, useValue: mockUseCase() },
        { provide: FindMonsterByKeyUseCase, useValue: mockUseCase() },
      ],
    }).compile();

    controller = module.get(BestiaryController);
    listBestiary = module.get(ListBestiaryUseCase);
    findMonster = module.get(FindMonsterByKeyUseCase);
  });

  it('rend le bestiaire sans le retoucher', async () => {
    const monsters = [aMonsterSnapshot()];
    vi.mocked(listBestiary.execute).mockResolvedValue(monsters);

    await expect(controller.listBestiary()).resolves.toEqual(monsters);
  });

  it('résout un profil par sa clé', async () => {
    const monster = aMonsterSnapshot();
    vi.mocked(findMonster.execute).mockResolvedValue(monster);

    await expect(controller.findMonster('gobelin')).resolves.toEqual(monster);
    expect(findMonster.execute).toHaveBeenCalledWith('gobelin', null);
  });
});

// Le JwtAuthGuard est monté en APP_GUARD : la protection ne s'assert pas par la
// présence d'un @UseGuards, mais par l'ABSENCE de @Public(). Un @Public() posé
// par erreur ici ouvrirait le bestiaire au monde.
describe('BestiaryController — protection des routes', () => {
  const ROUTES = ['listBestiary', 'findMonster'] as const;

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, BestiaryController)).toBeUndefined();
  });

  it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    const handler = BestiaryController.prototype[route];
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(BestiaryController.prototype).filter(
      (name) => name !== 'constructor',
    );
    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});
