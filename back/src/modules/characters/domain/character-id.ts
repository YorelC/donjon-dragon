import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

export class InvalidCharacterIdError extends InvalidDomainError {
  constructor() {
    super('Invalid character id');
  }
}

export class CharacterId {
  declare private readonly brand: 'CharacterId';

  private constructor(readonly value: string) {}

  static create(raw: string): CharacterId {
    if (!isUuid(raw)) throw new InvalidCharacterIdError();
    return new CharacterId(raw);
  }

  equals(other: CharacterId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
