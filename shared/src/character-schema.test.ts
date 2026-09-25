import { describe, it, expect } from 'vitest';

import {
  AbilityRollSchema,
  AbilityScoresSchema,
  AssignCharacterSchema,
  CampaignCharacterListItemSchema,
  CreateCharacterSchema,
  FinalizeCharacterSchema,
  IssuedAbilityRollSchema,
} from './character-schema.js';

describe('contrats d attribution et de projection', () => {
  it('exige une révision optimiste pour attribuer', () => {
    expect(AssignCharacterSchema.safeParse({
      playerDisplayName: 'Frodo', expectedRevision: 2,
    }).success).toBe(true);
    expect(AssignCharacterSchema.safeParse({ playerDisplayName: 'Frodo' }).success)
      .toBe(false);
  });

  it('interdit les champs privés dans la projection du vivier', () => {
    const projection = CampaignCharacterListItemSchema.parse({
      projection: 'pool', id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Bilbon', portrait: null, status: 'waiting_adventure',
      review: { status: 'submitted', lastRejectionReason: 'champ privé' },
      speciesName: 'Halfelin', lineageName: null, className: 'Roublard',
      level: 1, assignmentStatus: 'available', abilityRoll: { totals: [18] },
    });
    expect('abilityRoll' in projection).toBe(false);
    expect('lastRejectionReason' in projection.review).toBe(false);
  });
});

const VALID_SCORES = {
  strength: 8,
  dexterity: 16,
  constitution: 10,
  intelligence: 12,
  wisdom: 14,
  charisma: 13,
};

const A_ROLL_ID = '7d2b1c90-3e4f-4a56-9b81-0c5d6e7f8a90';

/** Le corps du `POST` : la création est le seul moment où un tirage se désigne. */
const A_CREATION_BODY = {
  name: 'Frodo Sacquet',
  alignment: 'chaoticGood',
  age: 33,
  heightCm: 96,
  weightKg: 30,
  description: null,
  speciesKey: 'halfling',
  lineageKey: null,
  size: 'Small',
  standardLanguages: ['common', 'halfling'],
  classKey: 'rogue',
  backgroundKey: 'charlatan',
  abilityMethod: 'roll',
  base: VALID_SCORES,
  backgroundBonuses: { dexterity: 2, charisma: 1 },
  choices: [
    {
      source: { type: 'class', key: 'rogue' },
      skills: ['acrobatics', 'insight', 'perception', 'stealth'],
      expertise: ['stealth', 'perception'],
    },
  ],
  equipment: {
    armorKey: 'leather',
    shield: false,
    items: [
      { itemKey: 'leather', quantity: 1 },
      { itemKey: 'dagger', quantity: 2 },
    ],
    gold: 8,
    classOptionId: 'A',
    backgroundOptionId: 'A',
  },
  abilityRollId: A_ROLL_ID,
};

/** Le corps du `PUT` : le personnage garde le tirage qu'il a déjà. */
const AN_EDIT_BODY = { ...A_CREATION_BODY, abilityRollId: null, expectedRevision: 0 };

describe('composition et tirage', () => {
  // Le contrat ne transporte plus de dés : un client ne peut plus les inventer.
  it('refuse un tirage envoyé à la place de sa référence', () => {
    const forged = { ...A_CREATION_BODY, abilityRollId: { totals: [18, 18, 18] } };

    expect(CreateCharacterSchema.safeParse(forged).success).toBe(false);
  });

  it("n'accepte comme référence qu'un identifiant de tirage", () => {
    const arbitrary = { ...A_CREATION_BODY, abilityRollId: 'tirage-42' };

    expect(CreateCharacterSchema.safeParse(arbitrary).success).toBe(false);
  });

  // Sans cette regle, un `pointBuy` consommerait un tirage avant qu'on l'ignore.
  it('exige un tirage pour la méthode « roll » à la création', () => {
    const rolled = { ...A_CREATION_BODY, abilityMethod: 'roll', abilityRollId: null };

    expect(CreateCharacterSchema.safeParse(rolled).success).toBe(false);
  });

  it('refuse un tirage pour les méthodes qui n’en ont pas', () => {
    const bought = {
      ...A_CREATION_BODY,
      abilityMethod: 'pointBuy',
      abilityRollId: '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8',
    };

    expect(CreateCharacterSchema.safeParse(bought).success).toBe(false);
  });

  it('accepte le tirage émis par le serveur', () => {
    const issued = {
      rollId: '3f1a2b4c-5d6e-4f70-8192-a3b4c5d6e7f8',
      dice: SIX_ROLLS_OF_FOUR,
      totals: [15, 14, 13, 12, 10, 8],
    };

    expect(IssuedAbilityRollSchema.safeParse(issued).success).toBe(true);
  });
});

const SIX_ROLLS_OF_FOUR = [
  [6, 5, 4, 1], [6, 4, 4, 2], [5, 4, 4, 3],
  [4, 4, 4, 1], [4, 3, 3, 2], [3, 3, 2, 1],
];

// Le `POST` et le `PUT` portent la même composition sous deux contrats. Les
// confondre casse l'édition de tout personnage tiré aux dés : c'est arrivé.
describe('création et édition, deux contrats distincts', () => {
  it('laisse éditer un personnage tiré aux dés, sans redésigner de tirage', () => {
    expect(FinalizeCharacterSchema.safeParse(AN_EDIT_BODY).success).toBe(true);
    expect(CreateCharacterSchema.safeParse(AN_EDIT_BODY).success).toBe(false);
  });

  it("refuse à l'édition de désigner un tirage, quelle que soit la méthode", () => {
    ['roll', 'standardArray', 'pointBuy'].forEach((abilityMethod) => {
      const edit = { ...A_CREATION_BODY, abilityMethod, abilityRollId: A_ROLL_ID };

      expect(FinalizeCharacterSchema.safeParse(edit).success).toBe(false);
    });
  });

  it('accepte la même composition à la création quand le tirage est désigné', () => {
    expect(CreateCharacterSchema.safeParse(A_CREATION_BODY).success).toBe(true);
  });
});

describe('composition partagée par le POST et le PUT', () => {
  it('accepte une fiche complète', () => {
    expect(CreateCharacterSchema.safeParse(A_CREATION_BODY).success).toBe(true);
  });

  it('refuse une espèce inconnue', () => {
    const result = FinalizeCharacterSchema.safeParse({
      ...A_CREATION_BODY,
      speciesKey: 'hobbit',
    });

    expect(result.success).toBe(false);
  });

  it('refuse un bonus d’historique que le PHB ne prévoit pas', () => {
    const result = FinalizeCharacterSchema.safeParse({
      ...A_CREATION_BODY,
      backgroundBonuses: { dexterity: 3 },
    });

    expect(result.success).toBe(false);
  });

  it('refuse une compétence inconnue dans un choix', () => {
    const result = FinalizeCharacterSchema.safeParse({
      ...A_CREATION_BODY,
      choices: [{ source: { type: 'class', key: 'rogue' }, skills: ['cuisine'] }],
    });

    expect(result.success).toBe(false);
  });

  it.each(['alignment', 'age', 'heightCm', 'weightKg', 'size', 'standardLanguages']) (
    'refuse le champ de création obligatoire absent : %s',
    (field) => {
      const incomplete = { ...A_CREATION_BODY } as Record<string, unknown>;
      delete incomplete[field];

      expect(FinalizeCharacterSchema.safeParse(incomplete).success).toBe(false);
    },
  );

  it('refuse une identité hors contrat', () => {
    expect(FinalizeCharacterSchema.safeParse({
      ...A_CREATION_BODY, alignment: 'pragmatique',
    }).success).toBe(false);
    expect(FinalizeCharacterSchema.safeParse({
      ...A_CREATION_BODY, age: 33.5,
    }).success).toBe(false);
    expect(FinalizeCharacterSchema.safeParse({
      ...A_CREATION_BODY, heightCm: 0,
    }).success).toBe(false);
  });

  it('n’accepte que les trois méthodes de génération connues', () => {
    ['roll', 'standardArray', 'pointBuy'].forEach((abilityMethod) => {
      const result = CreateCharacterSchema.safeParse({
        ...A_CREATION_BODY,
        abilityMethod,
        abilityRollId: abilityMethod === 'roll' ? A_ROLL_ID : null,
      });

      expect(result.success).toBe(true);
    });

    const invented = CreateCharacterSchema.safeParse({
      ...A_CREATION_BODY,
      abilityMethod: 'freeform',
    });

    expect(invented.success).toBe(false);
  });
});

describe('AbilityScoresSchema', () => {
  // 4d6 dont on garde les trois meilleurs ne sort jamais de [3, 18] : accepter
  // au-delà reviendrait à laisser passer un score qu'aucun tirage ne produit.
  it('borne chaque score entre 3 et 18', () => {
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 3 }).success).toBe(true);
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 18 }).success).toBe(true);
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 2 }).success).toBe(false);
    expect(AbilityScoresSchema.safeParse({ ...VALID_SCORES, strength: 19 }).success).toBe(false);
  });

  it('refuse une caractéristique manquante', () => {
    const { charisma: _charisma, ...incomplete } = VALID_SCORES;

    expect(AbilityScoresSchema.safeParse(incomplete).success).toBe(false);
  });
});

describe('AbilityRollSchema', () => {
  const sixRolls = [
    [6, 5, 4, 1],
    [6, 4, 4, 2],
    [5, 4, 4, 3],
    [4, 4, 4, 1],
    [4, 3, 3, 2],
    [3, 3, 2, 1],
  ];

  it('accepte six lancers de quatre d6 et leurs totaux', () => {
    const result = AbilityRollSchema.safeParse({
      dice: sixRolls,
      totals: [15, 14, 13, 12, 10, 8],
    });

    expect(result.success).toBe(true);
  });

  it('refuse un lancer qui n’a pas quatre dés', () => {
    const result = AbilityRollSchema.safeParse({
      dice: [[6, 5, 4], ...sixRolls.slice(1)],
      totals: [15, 14, 13, 12, 10, 8],
    });

    expect(result.success).toBe(false);
  });

  it('refuse une face qui n’existe pas sur un d6', () => {
    const result = AbilityRollSchema.safeParse({
      dice: [[6, 6, 6, 7], ...sixRolls.slice(1)],
      totals: [18, 14, 13, 12, 10, 8],
    });

    expect(result.success).toBe(false);
  });
});
