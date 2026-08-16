import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type { MonsterRepositoryPort } from '../../application/ports/monster.repository.port';
import type { Monster } from '../../domain/monster';
import type { MonsterKey } from '../../domain/monster-key';
import { toDomain, toPersistence, type MonsterDocument } from './monster.mapper';
import { MONSTER_MODEL } from './monster.schema';

const REFERENCE_SCOPE = { origin: 'srd', campaignId: null } as const;

@Injectable()
export class MongoMonsterRepository implements MonsterRepositoryPort {
  constructor(
    @InjectModel(MONSTER_MODEL) private readonly model: Model<MonsterDocument>,
  ) {}

  async save(monster: Monster): Promise<void> {
    const document = toPersistence(monster);
    await this.model.findOneAndUpdate(
      { key: document.key, origin: document.origin, campaignId: document.campaignId },
      document,
      { upsert: true },
    );
  }

  async findReferenceMonsters(): Promise<Monster[]> {
    return this.find(REFERENCE_SCOPE);
  }

  async findVisibleIn(campaignId: string | null): Promise<Monster[]> {
    const found = await this.find({ $or: visibleScopes(campaignId) });
    return preferCampaignMonsters(found);
  }

  async findByKey(key: MonsterKey, campaignId: string | null): Promise<Monster | null> {
    const found = await this.find({ key: key.value, $or: visibleScopes(campaignId) });
    return preferCampaignMonsters(found)[0] ?? null;
  }

  private async find(filter: Record<string, unknown>): Promise<Monster[]> {
    const docs = await this.model
      .find(filter)
      .sort({ key: 1 })
      .select('-_id')
      .lean<MonsterDocument[]>();

    return docs.map(toDomain);
  }
}

function visibleScopes(campaignId: string | null): Record<string, unknown>[] {
  if (campaignId === null) return [{ ...REFERENCE_SCOPE }];

  return [{ ...REFERENCE_SCOPE }, { origin: 'campaign', campaignId }];
}

/**
 * Une clé peut désigner deux profils : celui du manuel et celui que le MJ a
 * redéfini chez lui. C'est le sien qui gagne, sinon inventer son gobelin
 * n'aurait aucun effet sur sa table.
 */
function preferCampaignMonsters(found: Monster[]): Monster[] {
  const byKey = new Map<string, Monster>();
  for (const monster of found) {
    if (!byKey.has(monster.key) || monster.isHomebrew) byKey.set(monster.key, monster);
  }

  return [...byKey.values()];
}
