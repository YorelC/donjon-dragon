import { Inject, Injectable } from '@nestjs/common';
import type { Monster as MonsterDto } from '@donjon-dragon/shared/monster-schema';

import { MONSTER_REPOSITORY, type MonsterRepositoryPort } from '../ports/monster.repository.port';
import { toMonsterDto } from '../monster.mapper';

/**
 * Le bestiaire du manuel, en un seul appel. Il ne change qu'à une errata : le
 * front le charge une fois et le garde, comme le catalogue d'objets.
 */
@Injectable()
export class ListBestiaryUseCase {
  constructor(
    @Inject(MONSTER_REPOSITORY) private readonly monsters: MonsterRepositoryPort,
  ) {}

  async execute(): Promise<MonsterDto[]> {
    const monsters = await this.monsters.findReferenceMonsters();
    return monsters.map(toMonsterDto);
  }
}
