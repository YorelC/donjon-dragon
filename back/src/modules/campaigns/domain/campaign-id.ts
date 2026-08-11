import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

export class InvalidCampaignIdError extends InvalidDomainError {
  constructor() {
    super('Invalid campaign id');
  }
}

export class CampaignId {
  declare private readonly brand: 'CampaignId';

  private constructor(readonly value: string) {}

  static create(raw: string): CampaignId {
    if (!isUuid(raw)) throw new InvalidCampaignIdError();
    return new CampaignId(raw);
  }

  equals(other: CampaignId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
