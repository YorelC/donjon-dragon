import type { MonsterRepositoryPort } from '../application/ports/monster.repository.port';
import type { Monster } from '../domain/monster';
import type { MonsterKey } from '../domain/monster-key';

export class InMemoryMonsterRepository implements MonsterRepositoryPort {
  private readonly monsters = new Map<string, Monster>();

  constructor(seed: Monster[] = []) {
    for (const monster of seed) this.monsters.set(monster.key, monster);
  }

  save(monster: Monster): Promise<void> {
    this.monsters.set(monster.key, monster);
    return Promise.resolve();
  }

  findReferenceMonsters(): Promise<Monster[]> {
    return Promise.resolve([...this.monsters.values()].filter((monster) => !monster.isHomebrew));
  }

  findVisibleIn(campaignId: string | null): Promise<Monster[]> {
    const visible = [...this.monsters.values()].filter(
      (monster) => !monster.isHomebrew || (campaignId !== null && monster.isVisibleIn(campaignId)),
    );
    return Promise.resolve(visible);
  }

  findByKey(key: MonsterKey, _campaignId: string | null): Promise<Monster | null> {
    return Promise.resolve(this.monsters.get(key.value) ?? null);
  }
}
