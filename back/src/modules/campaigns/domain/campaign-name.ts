import { InvalidDomainError } from '@kernel/domain/domain.error';

/**
 * Bornes redéclarées ici, comme les rôles : le domaine ne dépend d'aucun schéma de
 * transport. Les mêmes valeurs vivent dans `CAMPAIGN_NAME_RULES` (shared/), qui
 * porte les messages destinés à l'utilisateur et arme le 400 du controller. Cette
 * validation-ci est la dernière barrière, celle qui tient même si l'agrégat est
 * construit depuis un script.
 *
 * `campaign.mapper.test.ts` échoue si les deux sources divergent.
 */
export const CAMPAIGN_NAME_LENGTH = {
  min: 10,
  max: 50,
} as const;

export class InvalidCampaignNameError extends InvalidDomainError {
  constructor() {
    super('Invalid campaign name');
  }
}

export class CampaignName {
  declare private readonly brand: 'CampaignName';

  private constructor(readonly value: string) {}

  static create(raw: string): CampaignName {
    const name = raw.trim();
    if (!isWithinBounds(name)) throw new InvalidCampaignNameError();
    return new CampaignName(name);
  }

  equals(other: CampaignName): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

function isWithinBounds(name: string): boolean {
  return (
    name.length >= CAMPAIGN_NAME_LENGTH.min &&
    name.length <= CAMPAIGN_NAME_LENGTH.max
  );
}
