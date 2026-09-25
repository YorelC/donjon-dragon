import { describe, expect, it } from 'vitest';

import { InvalidCharacterIdentityError } from './character-identity';
import { assertSpeciesPhysique, previewSizeOf, sizeFromHeight } from './character-physique';

const HUMAN_IDENTITY = {
  alignment: 'neutralGood' as const,
  age: 30,
  heightCm: 121,
  weightKg: 70,
  description: null,
};

describe('catégorie déduite de la taille physique', () => {
  it('classe un humain de 121 cm en Petite et de 122 cm en Moyenne', () => {
    expect(sizeFromHeight('human', 121)).toBe('Small');
    expect(sizeFromHeight('human', 122)).toBe('Medium');
  });

  it('conserve la catégorie fixe des autres espèces', () => {
    expect(sizeFromHeight('halfling', 90)).toBe('Small');
    expect(sizeFromHeight('dwarf', 140)).toBe('Medium');
  });

  it('retient la catégorie par défaut de l’espèce tant que l’aperçu n’a pas de taille', () => {
    expect(previewSizeOf('human', undefined)).toBe('Medium');
    expect(previewSizeOf('human', 100)).toBe('Small');
  });
});

describe('bornes physiques de l’espèce', () => {
  it('accepte des mesures dans les bornes', () => {
    expect(() => assertSpeciesPhysique('human', HUMAN_IDENTITY)).not.toThrow();
  });

  it('refuse une taille ou un poids hors des bornes', () => {
    expect(() => assertSpeciesPhysique('human', { ...HUMAN_IDENTITY, heightCm: 60 }))
      .toThrow(InvalidCharacterIdentityError);
    expect(() => assertSpeciesPhysique('human', { ...HUMAN_IDENTITY, weightKg: 124 }))
      .toThrow(InvalidCharacterIdentityError);
  });

  it('borne le goliath entre 93 et 200 kg', () => {
    const goliath = { ...HUMAN_IDENTITY, heightCm: 220 };

    expect(() => assertSpeciesPhysique('goliath', { ...goliath, weightKg: 93 })).not.toThrow();
    expect(() => assertSpeciesPhysique('goliath', { ...goliath, weightKg: 200 })).not.toThrow();
    expect(() => assertSpeciesPhysique('goliath', { ...goliath, weightKg: 201 }))
      .toThrow(InvalidCharacterIdentityError);
  });
});
