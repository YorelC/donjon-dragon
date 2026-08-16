import type { ItemRepositoryPort } from '../application/ports/item.repository.port';
import type { Item } from '../domain/item';
import type { ItemKey } from '../domain/item-key';

export class InMemoryItemRepository implements ItemRepositoryPort {
  private readonly items = new Map<string, Item>();

  constructor(seed: Item[] = []) {
    for (const item of seed) this.items.set(item.key, item);
  }

  save(item: Item): Promise<void> {
    this.items.set(item.key, item);
    return Promise.resolve();
  }

  findReferenceItems(): Promise<Item[]> {
    return Promise.resolve([...this.items.values()]);
  }

  findManyByKeys(keys: ItemKey[], _campaignId: string | null): Promise<Item[]> {
    const found = keys
      .map((key) => this.items.get(key.value))
      .filter((item): item is Item => item !== undefined);
    return Promise.resolve(found);
  }
}
