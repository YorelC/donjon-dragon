import type { ItemType } from '@donjon-dragon/shared/item-schema';

import type { DexterityAllowance } from '../../domain/reference/armors';

export const ITEM_CATALOG = Symbol('ITEM_CATALOG');

/** Ce qu'il faut d'un objet porté pour calculer une classe d'armure. */
export interface CatalogedArmor {
  baseArmorClass: number;
  dexterityAllowance: DexterityAllowance;
  stealthDisadvantage: boolean;
}

export interface CatalogedItem {
  key: string;
  name: string;
  /** La catégorie sous laquelle la fiche range l'objet. */
  type: ItemType;
  /** Non nul pour les armures et les boucliers seuls. */
  armor: CatalogedArmor | null;
}

/**
 * Anti-corruption layer vers `items`, réduite à ce dont un personnage a besoin :
 * ces clés désignent-elles de vrais objets, comment s'appellent-ils, où la fiche
 * les range-t-elle, et que font-ils à la classe d'armure ?
 *
 * Le module ne connaît ni l'agrégat `Item`, ni sa provenance. Le
 * jour où un MJ inventera des objets dans sa campagne, la réponse changera sans
 * que rien ne bouge ici — c'est tout l'intérêt.
 */
export interface ItemCatalogPort {
  /**
   * Résolution dans le contexte d'une campagne : le manuel, plus ce que le MJ y a
   * inventé. Un objet de campagne l'emporte sur l'objet du manuel de même clé —
   * c'est ce qui permet de redéfinir une épée longue chez soi.
   */
  findByKeys(keys: string[], campaignId: string): Promise<CatalogedItem[]>;
}
