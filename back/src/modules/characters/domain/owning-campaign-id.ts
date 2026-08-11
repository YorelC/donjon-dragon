import { InvalidDomainError } from '@kernel/domain/domain.error';
import { isUuid } from '@kernel/domain/uuid';

/**
 * Identifiant de la campagne qui porte ce personnage, redéclaré ici plutôt
 * qu'importé de `campaigns/domain` : un module ne dépend jamais du domaine d'un
 * voisin, seulement de ses use-cases exportés (`GetCampaignMembershipUseCase`).
 */
export class InvalidOwningCampaignIdError extends InvalidDomainError {
  constructor() {
    super('Invalid campaign id');
  }
}

export class OwningCampaignId {
  declare private readonly brand: 'OwningCampaignId';

  private constructor(readonly value: string) {}

  static create(raw: string): OwningCampaignId {
    if (!isUuid(raw)) throw new InvalidOwningCampaignIdError();
    return new OwningCampaignId(raw);
  }

  equals(other: OwningCampaignId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
