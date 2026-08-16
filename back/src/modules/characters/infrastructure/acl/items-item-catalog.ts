import { Injectable } from '@nestjs/common';
import type { Item as ItemDto } from '@donjon-dragon/shared/item-schema';

import { FindItemsByKeysUseCase } from '@modules/items/application/use-cases/find-items-by-keys.use-case';
import type {
  CatalogedArmor,
  CatalogedItem,
  ItemCatalogPort,
} from '../../application/ports/item-catalog.port';

/** SEUL fichier du module characters qui connaît le module items. */
@Injectable()
export class ItemsItemCatalog implements ItemCatalogPort {
  constructor(private readonly findItemsByKeys: FindItemsByKeysUseCase) {}

  async findByKeys(keys: string[], campaignId: string): Promise<CatalogedItem[]> {
    const items = await this.findItemsByKeys.execute({ keys, campaignId });
    return items.map(toCatalogedItem);
  }
}

function toCatalogedItem(item: ItemDto): CatalogedItem {
  return { key: item.key, name: item.name, armor: toCatalogedArmor(item) };
}

/**
 * Le `training` et la force requise ne remontent pas : le moteur ne s'en sert
 * pas pour la classe d'armure. Un port dit le besoin de l'appelant, pas tout ce
 * que le voisin sait faire.
 */
function toCatalogedArmor(item: ItemDto): CatalogedArmor | null {
  if (!item.armor) return null;

  return {
    baseArmorClass: item.armor.baseArmorClass,
    dexterityAllowance: item.armor.dexterityAllowance,
    stealthDisadvantage: item.armor.stealthDisadvantage,
  };
}
