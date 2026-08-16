import { Inject, Injectable } from '@nestjs/common';
import type { Monster as MonsterDto } from '@donjon-dragon/shared/monster-schema';

import { MonsterNotFoundError } from '../../domain/monster.errors';
import { MonsterKey } from '../../domain/monster-key';
import { MONSTER_REPOSITORY, type MonsterRepositoryPort } from '../ports/monster.repository.port';
import { toMonsterDto } from '../monster.mapper';

/**
 * Un profil précis, résolu dans la portée d'une campagne : si le MJ a redéfini
 * le gobelin chez lui, c'est le sien qu'on rend.
 */
@Injectable()
export class FindMonsterByKeyUseCase {
  constructor(
    @Inject(MONSTER_REPOSITORY) private readonly monsters: MonsterRepositoryPort,
  ) {}

  async execute(rawKey: string, campaignId: string | null): Promise<MonsterDto> {
    const monster = await this.monsters.findByKey(MonsterKey.create(rawKey), campaignId);
    if (!monster) throw new MonsterNotFoundError();

    return toMonsterDto(monster);
  }
}
