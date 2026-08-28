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

export interface CharacterIdentitySnapshot {
  alignment: Alignment;
  age: number;
  heightCm: number;
  weightKg: number;
  description: string | null;
}

export interface CharacterIdentityInput {
  alignment?: Alignment;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  description?: string | null;
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
    return new CharacterIdentity({ ...input, description: input.description ?? null });
  }

  static restore(snapshot: CharacterIdentitySnapshot): CharacterIdentity {
    return new CharacterIdentity({ ...snapshot });
  }

  snapshot(): CharacterIdentitySnapshot {
    return { ...this.state };
  }
}

function assertIdentity(input: CharacterIdentityInput): asserts input is CharacterIdentitySnapshot {
  const alignmentIsKnown = ALIGNMENTS.includes(input.alignment as Alignment);
  const ageIsValid = Number.isInteger(input.age) && isPositive(input.age);
  const measuresAreValid = isPositive(input.heightCm) && isPositive(input.weightKg);
  if (!alignmentIsKnown || !ageIsValid || !measuresAreValid) {
    throw new InvalidCharacterIdentityError();
  }
}

function isPositive(value: number | undefined): value is number {
  return value !== undefined && Number.isFinite(value) && value > 0;
}
