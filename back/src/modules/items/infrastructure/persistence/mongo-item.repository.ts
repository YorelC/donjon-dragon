import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import type { ItemRepositoryPort } from '../../application/ports/item.repository.port';
import type { Item } from '../../domain/item';
import type { ItemKey } from '../../domain/item-key';
import { toDomain, toPersistence, type ItemDocument } from './item.mapper';
import { ITEM_MODEL } from './item.schema';

const REFERENCE_SCOPE = { source: 'srd', campaignId: null } as const;

@Injectable()
export class MongoItemRepository implements ItemRepositoryPort {
  constructor(
    @InjectModel(ITEM_MODEL) private readonly model: Model<ItemDocument>,
  ) {}

  async save(item: Item): Promise<void> {
    const document = toPersistence(item);
    await this.model.findOneAndUpdate(
      { key: document.key, source: document.source, campaignId: document.campaignId },
      document,
      { upsert: true },
    );
  }

  async findReferenceItems(): Promise<Item[]> {
    return this.find(REFERENCE_SCOPE);
  }

  async findManyByKeys(keys: ItemKey[], campaignId: string | null): Promise<Item[]> {
    const found = await this.find({
      key: { $in: keys.map((key) => key.value) },
      $or: visibleScopes(campaignId),
    });

    return preferCampaignItems(found);
  }

  async pruneReferenceItems(keptKeys: ItemKey[]): Promise<number> {
    const result = await this.model.deleteMany({
      ...REFERENCE_SCOPE,
      key: { $nin: keptKeys.map((key) => key.value) },
    });

    return result.deletedCount;
  }

  private async find(filter: Record<string, unknown>): Promise<Item[]> {
    const docs = await this.model.find(filter).sort({ key: 1 }).select('-_id').lean<ItemDocument[]>();
    return docs.map(toDomain);
  }
}

function visibleScopes(campaignId: string | null): Record<string, unknown>[] {
  if (campaignId === null) return [{ ...REFERENCE_SCOPE }];

  return [{ ...REFERENCE_SCOPE }, { source: 'campaign', campaignId }];
}

/**
 * Une clé peut désigner deux objets : celui du manuel et celui que le MJ a
 * redéfini chez lui. C'est le sien qui gagne, sinon inventer une épée longue
 * n'aurait aucun effet sur sa table.
 */
function preferCampaignItems(found: Item[]): Item[] {
  const byKey = new Map<string, Item>();
  for (const item of found) {
    if (!byKey.has(item.key) || item.isHomebrew) byKey.set(item.key, item);
  }

  return [...byKey.values()];
}
