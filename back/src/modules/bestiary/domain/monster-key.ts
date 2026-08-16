import { InvalidDomainError } from '@kernel/domain/domain.error';

/**
 * Une clé de monstre passe dans une URL et dans un index Mongo : ASCII,
 * minuscule, segments séparés par un tiret. `gobelin`, `dragon-noir-ancien`.
 */
const KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class InvalidMonsterKeyError extends InvalidDomainError {
  constructor() {
    super('Invalid monster key');
  }
}

export class MonsterKey {
  declare private readonly brand: 'MonsterKey';

  private constructor(readonly value: string) {}

  static create(raw: string): MonsterKey {
    if (!KEY_PATTERN.test(raw)) throw new InvalidMonsterKeyError();
    return new MonsterKey(raw);
  }

  equals(other: MonsterKey): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
