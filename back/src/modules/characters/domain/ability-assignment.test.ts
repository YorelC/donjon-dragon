import { describe, expect, it } from 'vitest';

import {
  AbilityAssignment,
  AbilityAssignmentMismatchError,
  InvalidBackgroundBonusesError,
  type AbilityBonuses,
} from './ability-assignment';
import { AbilityRoll } from './ability-roll';
import type { AbilityRecord } from './reference/abilities';

/** Totaux : 15 / 14 / 13 / 12 / 10 / 8. */
const ROLL = AbilityRoll.create([
  [6, 5, 4, 1],
  [6, 4, 4, 2],
  [5, 4, 4, 3],
  [4, 4, 4, 1],
  [4, 3, 3, 2],
  [3, 3, 2, 1],
]);

const VALID_BASE: AbilityRecord = {
  strength: 15,
  dexterity: 14,
  constitution: 13,
  intelligence: 12,
  wisdom: 10,
  charisma: 8,
};

function assign(base: AbilityRecord, backgroundBonuses: AbilityBonuses = {}) {
  return AbilityAssignment.create({ roll: ROLL, base, backgroundBonuses });
}

describe('AbilityAssignment', () => {
  it('accepte n’importe quelle permutation du tirage', () => {
    const reversed: AbilityRecord = {
      strength: 8,
      dexterity: 10,
      constitution: 12,
      intelligence: 13,
      wisdom: 14,
      charisma: 15,
    };

    expect(() => assign(reversed)).not.toThrow();
  });

  // L'invariant qui rend le tirage serveur utile : sans lui, un client bricolé
  // enverrait six 18 et rien ne l'arrêterait.
  it('refuse des scores qui ne sortent pas du tirage', () => {
    const cheated: AbilityRecord = {
      strength: 18,
      dexterity: 18,
      constitution: 18,
      intelligence: 18,
      wisdom: 18,
      charisma: 18,
    };

    expect(() => assign(cheated)).toThrow(AbilityAssignmentMismatchError);
  });

  it('refuse un seul score échangé contre un meilleur', () => {
    expect(() => assign({ ...VALID_BASE, charisma: 15 })).toThrow(
      AbilityAssignmentMismatchError,
    );
  });

  it('accepte les deux répartitions de bonus d’historique', () => {
    const focused = assign(VALID_BASE, { strength: 2, dexterity: 1 });
    const spread = assign(VALID_BASE, { strength: 1, dexterity: 1, constitution: 1 });

    expect(() => focused.assertBonusesFit(['strength', 'dexterity', 'constitution'])).not.toThrow();
    expect(() => spread.assertBonusesFit(['strength', 'dexterity', 'constitution'])).not.toThrow();
  });

  it('refuse une répartition que le PHB ne prévoit pas', () => {
    const tooGenerous = assign(VALID_BASE, { strength: 2, dexterity: 2 });

    expect(() => tooGenerous.assertBonusesFit(['strength', 'dexterity', 'constitution'])).toThrow(
      InvalidBackgroundBonusesError,
    );
  });

  it('refuse un bonus posé hors des caractéristiques de l’historique', () => {
    const offBackground = assign(VALID_BASE, { charisma: 2, wisdom: 1 });

    expect(() => offBackground.assertBonusesFit(['strength', 'dexterity', 'constitution'])).toThrow(
      InvalidBackgroundBonusesError,
    );
  });
});
