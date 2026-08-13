import { InvalidDomainError } from '@kernel/domain/domain.error';

import { ARMORS } from './reference/armors';

export interface CharacterEquipmentSnapshot {
  /** `null` quand le personnage ne porte rien : le moine et le barbare en vivent. */
  armorKey: string | null;
  shield: boolean;
  items: string[];
  gold: number;
}

export class UnknownArmorError extends InvalidDomainError {
  constructor() {
    super('Unknown armor');
  }
}

export class NegativeGoldError extends InvalidDomainError {
  constructor() {
    super('Gold cannot be negative');
  }
}

/**
 * Ce que porte le personnage. Seuls l'armure et le bouclier sont interprétés par
 * le moteur — ils décident de la classe d'armure. Le reste du paquetage est du
 * texte : au niveau 1 rien d'autre n'entre dans une formule.
 */
export class CharacterEquipment {
  declare private readonly brand: 'CharacterEquipment';

  private constructor(
    readonly armorKey: string | null,
    readonly shield: boolean,
    private readonly carried: readonly string[],
    readonly gold: number,
  ) {}

  static create(snapshot: CharacterEquipmentSnapshot): CharacterEquipment {
    if (snapshot.armorKey !== null && !ARMORS[snapshot.armorKey]) {
      throw new UnknownArmorError();
    }
    if (snapshot.gold < 0) throw new NegativeGoldError();

    return new CharacterEquipment(
      snapshot.armorKey,
      snapshot.shield,
      [...snapshot.items],
      snapshot.gold,
    );
  }

  static restore(snapshot: CharacterEquipmentSnapshot): CharacterEquipment {
    return new CharacterEquipment(
      snapshot.armorKey,
      snapshot.shield,
      [...snapshot.items],
      snapshot.gold,
    );
  }

  get isUnarmored(): boolean {
    return this.armorKey === null;
  }

  get items(): readonly string[] {
    return this.carried;
  }

  snapshot(): CharacterEquipmentSnapshot {
    return {
      armorKey: this.armorKey,
      shield: this.shield,
      items: [...this.carried],
      gold: this.gold,
    };
  }
}
