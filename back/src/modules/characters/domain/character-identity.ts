import { InvalidDomainError } from '@kernel/domain/domain.error';

export const ALIGNMENTS = [
  'lawfulGood',
  'neutralGood',
  'chaoticGood',
  'lawfulNeutral',
  'trueNeutral',
  'chaoticNeutral',
  'lawfulEvil',
  'neutralEvil',
  'chaoticEvil',
] as const;

export type Alignment = (typeof ALIGNMENTS)[number];

export const CHARACTER_NARRATIVE_DETAIL_MAX_LENGTH = 1_000;

/** Libellés français, arrêtés par Charly le 31/08/2026. */
export const ALIGNMENT_LABELS: Record<Alignment, string> = {
  lawfulGood: 'Loyal bon',
  neutralGood: 'Neutre bon',
  chaoticGood: 'Chaotique bon',
  lawfulNeutral: 'Loyal neutre',
  trueNeutral: 'Neutre pur',
  chaoticNeutral: 'Chaotique neutre',
  lawfulEvil: 'Loyal mauvais',
  neutralEvil: 'Neutre mauvais',
  chaoticEvil: 'Chaotique mauvais',
};

export interface CharacterIdentitySnapshot {
  alignment: Alignment;
  age: number;
  heightCm: number;
  weightKg: number;
  description: string | null;
  personalityTraits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
}

export interface CharacterIdentityInput {
  alignment?: Alignment;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  description?: string | null;
  personalityTraits?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
}

export class InvalidCharacterIdentityError extends InvalidDomainError {
  constructor() {
    super('Character identity is incomplete or invalid');
  }
}

export class CharacterIdentity {
  private constructor(private readonly state: CharacterIdentitySnapshot) {}

  static create(input: CharacterIdentityInput): CharacterIdentity {
    assertIdentity(input);
    return new CharacterIdentity(identitySnapshotOf(input));
  }

  static restore(snapshot: CharacterIdentitySnapshot): CharacterIdentity {
    return new CharacterIdentity(identitySnapshotOf(snapshot));
  }

  snapshot(): CharacterIdentitySnapshot {
    return { ...this.state };
  }
}

type CompleteIdentityInput = CharacterIdentityInput & {
  alignment: Alignment;
  age: number;
  heightCm: number;
  weightKg: number;
};

function assertIdentity(input: CharacterIdentityInput): asserts input is CompleteIdentityInput {
  const alignmentIsKnown = ALIGNMENTS.includes(input.alignment as Alignment);
  const ageIsValid = Number.isInteger(input.age) && isPositive(input.age);
  const measuresAreValid = isPositive(input.heightCm) && isPositive(input.weightKg);
  const identityIsValid = [
    alignmentIsKnown, ageIsValid, measuresAreValid, narrativesAreValid(input),
  ].every(Boolean);
  if (!identityIsValid) throw new InvalidCharacterIdentityError();
}

function identitySnapshotOf(input: CompleteIdentityInput): CharacterIdentitySnapshot {
  return {
    alignment: input.alignment,
    age: input.age,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    description: normalizeNarrative(input.description),
    ...narrativeDetailsOf(input),
  };
}

function narrativesAreValid(input: CharacterIdentityInput): boolean {
  return [input.description, ...narrativeValuesOf(input)].every(narrativeIsValid);
}

function narrativeIsValid(value: string | null | undefined): boolean {
  if (value === undefined || value === null) return true;
  return value.trim().length <= CHARACTER_NARRATIVE_DETAIL_MAX_LENGTH;
}

function narrativeDetailsOf(input: CharacterIdentityInput) {
  const [personalityTraits, ideals, bonds, flaws] = narrativeValuesOf(input);
  return {
    personalityTraits: normalizeNarrative(personalityTraits),
    ideals: normalizeNarrative(ideals),
    bonds: normalizeNarrative(bonds),
    flaws: normalizeNarrative(flaws),
  };
}

function narrativeValuesOf(input: CharacterIdentityInput) {
  return [input.personalityTraits, input.ideals, input.bonds, input.flaws] as const;
}

function normalizeNarrative(value: string | null | undefined): string | null {
  return value?.trim() || null;
}

function isPositive(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0;
}
