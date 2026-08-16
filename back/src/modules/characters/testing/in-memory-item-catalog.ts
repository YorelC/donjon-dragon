import type { CatalogedItem, ItemCatalogPort } from '../application/ports/item-catalog.port';

/** Les clés d'objet que porte `aCharacterBody()` : le catalogue des tests les connaît. */
export const FIXTURE_ITEM_KEYS = ['leather', 'dagger', 'chain-mail', 'shield'] as const;

/**
 * Les armures du double portent leurs statistiques : sans elles, rien ne
 * pourrait vérifier que la classe d'armure suit bien le catalogue plutôt qu'une
 * table compilée dans le domaine.
 */
const KNOWN_ARMORS: Record<string, CatalogedItem['armor']> = {
  leather: { baseArmorClass: 11, dexterityAllowance: 'full', stealthDisadvantage: false },
  'chain-mail': { baseArmorClass: 16, dexterityAllowance: 'none', stealthDisadvantage: true },
  shield: { baseArmorClass: 2, dexterityAllowance: 'none', stealthDisadvantage: false },
};

export class InMemoryItemCatalog implements ItemCatalogPort {
  constructor(private readonly known: readonly string[] = FIXTURE_ITEM_KEYS) {}

  findByKeys(keys: string[], _campaignId: string): Promise<CatalogedItem[]> {
    const found = keys
      .filter((key) => this.known.includes(key))
      .map((key) => ({ key, name: key, armor: KNOWN_ARMORS[key] ?? null }));

    return Promise.resolve(found);
  }
}
