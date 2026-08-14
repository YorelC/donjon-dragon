import { describe, expect, it } from 'vitest';

import {
  AbilityAssignment,
  AbilityAssignmentMismatchError,
  InvalidBackgroundBonusesError,
  NotAStandardArrayError,
  PointBuyBudgetExceededError,
  ScoreOutsidePointBuyRangeError,
  type AbilityBonuses,
} from './ability-assignment';
import type { AbilityMethod } from './ability-generation';
import { AbilityRoll } from './ability-roll';
import { AbilitiesNotRolledError } from './character.errors';
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
  return AbilityAssignment.create({
    method: 'roll',
    roll: ROLL,
    base,
    backgroundBonuses,
  });
}

function withMethod(method: AbilityMethod, base: AbilityRecord) {
  return () =>
    AbilityAssignment.create({ method, roll: null, base, backgroundBonuses: {} });
}

function scores(values: readonly number[]): AbilityRecord {
  const [strength, dexterity, constitution, intelligence, wisdom, charisma] = values;

  return {
    strength: strength ?? 0,
    dexterity: dexterity ?? 0,
    constitution: constitution ?? 0,
    intelligence: intelligence ?? 0,
    wisdom: wisdom ?? 0,
    charisma: charisma ?? 0,
  };
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

  it('refuse la méthode du tirage sans tirage', () => {
    expect(withMethod('roll', VALID_BASE)).toThrow(AbilitiesNotRolledError);
  });
});

describe('AbilityAssignment — tableau standard', () => {
  it('accepte les six valeurs imposées, dans n’importe quel ordre', () => {
    expect(withMethod('standardArray', scores([8, 10, 12, 13, 14, 15]))).not.toThrow();
    expect(withMethod('standardArray', scores([15, 14, 13, 12, 10, 8]))).not.toThrow();
  });

  it('refuse un tableau bricolé', () => {
    expect(withMethod('standardArray', scores([15, 15, 13, 12, 10, 8]))).toThrow(
      NotAStandardArrayError,
    );
  });

  it('n’a besoin d’aucun tirage', () => {
    expect(withMethod('standardArray', scores([15, 14, 13, 12, 10, 8]))).not.toThrow();
  });
});

describe('AbilityAssignment — achat de points', () => {
  // 15 coûte 9, 14 coûte 7, 13 coûte 5, 12 coûte 4, 10 coûte 2, 8 coûte 0 : 27 pile.
  it('accepte une dépense de 27 points exactement', () => {
    expect(withMethod('pointBuy', scores([15, 14, 13, 12, 10, 8]))).not.toThrow();
  });

  // Le même achat en remplaçant le 8 (0 point) par un 9 (1 point) : 28.
  it('refuse un point de trop', () => {
    expect(withMethod('pointBuy', scores([15, 14, 13, 12, 10, 9]))).toThrow(
      PointBuyBudgetExceededError,
    );
  });

  it('accepte de dépenser moins que le budget', () => {
    expect(withMethod('pointBuy', scores([8, 8, 8, 8, 8, 8]))).not.toThrow();
  });

  it('refuse un score hors des bornes 8-15', () => {
    expect(withMethod('pointBuy', scores([16, 8, 8, 8, 8, 8]))).toThrow(
      ScoreOutsidePointBuyRangeError,
    );
    expect(withMethod('pointBuy', scores([7, 8, 8, 8, 8, 8]))).toThrow(
      ScoreOutsidePointBuyRangeError,
    );
  });
});
