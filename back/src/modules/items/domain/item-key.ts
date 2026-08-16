import { InvalidDomainError } from '@kernel/domain/domain.error';

/**
 * Une clé d'objet passe dans une URL et dans un index Mongo : ASCII, minuscule,
 * segments séparés par un tiret. `chain-mail`, `paquetage-explorateur`.
 */
const KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class InvalidItemKeyError extends InvalidDomainError {
  constructor() {
    super('Invalid item key');
  }
}

export class ItemKey {
  declare private readonly brand: 'ItemKey';

  private constructor(readonly value: string) {}

  static create(raw: string): ItemKey {
    if (!KEY_PATTERN.test(raw)) throw new InvalidItemKeyError();
    return new ItemKey(raw);
  }

  equals(other: ItemKey): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
