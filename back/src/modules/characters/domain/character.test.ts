import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { AbilityScores } from './ability-scores';
import { Character, type CharacterAccessContext, type CharacterSheet } from './character';
import { CharacterName } from './character-name';
import { CharacterTrait } from './character-trait';
import {
  AlreadyAssignedToThisPlayerError,
  NotAssignedError,
  NotEditableByActorError,
  OnlyGameMasterCanAssignError,
} from './character.errors';
import { OwningCampaignId } from './owning-campaign-id';

const gandalf = UserId.create(randomUUID());
const frodo = UserId.create(randomUUID());
const sam = UserId.create(randomUUID());
const campaignId = OwningCampaignId.create(randomUUID());

const NOW = TEST_INSTANT;

const SHEET: CharacterSheet = {
  name: CharacterName.create('Frodo Sacquet'),
  race: CharacterTrait.create('Hobbit', 'la race'),
  characterClass: CharacterTrait.create('Voleur', 'la classe'),
  abilityScores: AbilityScores.create({
    strength: 8,
    dexterity: 16,
    constitution: 10,
    intelligence: 12,
    wisdom: 14,
    charisma: 13,
  }),
};

function aCharacter(createdBy: UserId = gandalf): Character {
  return Character.create(campaignId, SHEET, createdBy, NOW);
}

function contextFor(overrides: Partial<CharacterAccessContext>): CharacterAccessContext {
  return {
    actorId: frodo,
    actorIsGameMaster: false,
    actorIsCampaignOwner: false,
    creatorIsGameMaster: true,
    ...overrides,
  };
}

describe('Character.create', () => {
  it('naît non assigné', () => {
    expect(aCharacter().assignedTo).toBeNull();
  });
});

describe('Character.selfAssignToCreator', () => {
  it('assigne le personnage à son créateur', () => {
    const character = Character.create(campaignId, SHEET, frodo, NOW);
    character.selfAssignToCreator(NOW);

    expect(character.assignedTo?.equals(frodo)).toBe(true);
  });
});

describe('Character.assignTo', () => {
  it('refuse un acteur qui n est pas maître du jeu', () => {
    const character = aCharacter();
    expect(() => character.assignTo(false, frodo, NOW)).toThrow(
      OnlyGameMasterCanAssignError,
    );
  });

  it('refuse une réattribution au même joueur', () => {
    const character = aCharacter();
    character.assignTo(true, frodo, NOW);

    expect(() => character.assignTo(true, frodo, NOW)).toThrow(
      AlreadyAssignedToThisPlayerError,
    );
  });
});

describe('Character.unassign', () => {
  it('refuse un acteur qui n est pas maître du jeu', () => {
    const character = aCharacter();
    character.assignTo(true, frodo, NOW);

    expect(() => character.unassign(false, NOW)).toThrow(OnlyGameMasterCanAssignError);
  });

  it('refuse un personnage déjà non assigné', () => {
    expect(() => aCharacter().unassign(true, NOW)).toThrow(NotAssignedError);
  });
});

describe('Character.assertEditableBy', () => {
  it('laisse le joueur éditer son propre personnage assigné', () => {
    const character = aCharacter(gandalf);
    character.assignTo(true, frodo, NOW);

    expect(() =>
      character.assertEditableBy(contextFor({ actorId: frodo })),
    ).not.toThrow();
  });

  it('refuse un joueur sur un personnage qui ne lui est pas assigné', () => {
    const character = aCharacter(gandalf);

    expect(() =>
      character.assertEditableBy(contextFor({ actorId: sam })),
    ).toThrow(NotEditableByActorError);
  });

  it('laisse un MJ éditer ce qu il a créé', () => {
    const character = aCharacter(frodo);

    expect(() =>
      character.assertEditableBy(
        contextFor({ actorId: frodo, actorIsGameMaster: true, creatorIsGameMaster: true }),
      ),
    ).not.toThrow();
  });

  it('laisse un MJ éditer un personnage attribué à un joueur', () => {
    const character = aCharacter(gandalf);
    character.assignTo(true, frodo, NOW);

    expect(() =>
      character.assertEditableBy(
        contextFor({ actorId: sam, actorIsGameMaster: true, creatorIsGameMaster: true }),
      ),
    ).not.toThrow();
  });

  it('laisse un MJ éditer un personnage non attribué créé par un joueur', () => {
    const character = aCharacter(frodo);

    expect(() =>
      character.assertEditableBy(
        contextFor({ actorId: sam, actorIsGameMaster: true, creatorIsGameMaster: false }),
      ),
    ).not.toThrow();
  });

  it('refuse un MJ sur un personnage non attribué créé par un autre MJ', () => {
    const character = aCharacter(gandalf);

    expect(() =>
      character.assertEditableBy(
        contextFor({ actorId: sam, actorIsGameMaster: true, creatorIsGameMaster: true }),
      ),
    ).toThrow(NotEditableByActorError);
  });

  it('laisse le propriétaire de la campagne éditer le personnage d un autre MJ', () => {
    const character = aCharacter(gandalf);

    expect(() =>
      character.assertEditableBy(
        contextFor({
          actorId: sam,
          actorIsGameMaster: true,
          creatorIsGameMaster: true,
          actorIsCampaignOwner: true,
        }),
      ),
    ).not.toThrow();
  });
});
