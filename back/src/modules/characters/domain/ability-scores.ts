import { InvalidDomainError } from '@kernel/domain/domain.error';

export const ABILITY_SCORE_BOUNDS = {
  min: 1,
  max: 30,
} as const;

export interface AbilityScoresSnapshot {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export class InvalidAbilityScoreError extends InvalidDomainError {
  constructor() {
    super('Invalid ability score');
  }
}

/** Les six caractéristiques classiques de D&D, bornées et immuables ensemble. */
export class AbilityScores {
  declare private readonly brand: 'AbilityScores';

  private constructor(private readonly scores: AbilityScoresSnapshot) {}

  static create(scores: AbilityScoresSnapshot): AbilityScores {
    if (!Object.values(scores).every(isWithinBounds)) {
      throw new InvalidAbilityScoreError();
    }
    return new AbilityScores({ ...scores });
  }

  snapshot(): AbilityScoresSnapshot {
    return { ...this.scores };
  }
}

function isWithinBounds(score: number): boolean {
  return (
    Number.isInteger(score) &&
    score >= ABILITY_SCORE_BOUNDS.min &&
    score <= ABILITY_SCORE_BOUNDS.max
  );
}
