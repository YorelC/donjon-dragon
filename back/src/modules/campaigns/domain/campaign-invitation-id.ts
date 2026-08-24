import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

export class InvalidCampaignInvitationIdError extends InvalidDomainError {
  constructor() {
    super('Invalid campaign invitation id');
  }
}

export class CampaignInvitationId {
  declare private readonly brand: 'CampaignInvitationId';

  private constructor(readonly value: string) {}

  static create(raw: string): CampaignInvitationId {
    if (!isUuid(raw)) throw new InvalidCampaignInvitationIdError();
    return new CampaignInvitationId(raw);
  }

  equals(other: CampaignInvitationId): boolean {
    return this.value === other.value;
  }
}
