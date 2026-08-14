import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { STANDARD_ARRAY_ROLL } from '../testing/character-build.fixture';
import { A_CHARACTER_BUILD, A_CHARACTER_NAME } from '../testing/character.fixture';
import { AbilityAssignmentMismatchError } from './ability-assignment';
import { Character, type CharacterAccessContext } from './character';
import { CharacterName } from './character-name';
import {
  AbilitiesNotRolledError,
  AlreadyAssignedToThisPlayerError,
  CharacterAlreadyReadyError,
  CharacterNotReadyError,
  NotAssignedError,
  NotEditableByActorError,
  OnlyGameMasterCanAssignError,
} from './character.errors';
import { InvalidSkillChoiceError, LineageRequiredError } from './resolution/validate-choices';
import { OwningCampaignId } from './owning-campaign-id';

const gandalf = UserId.create(randomUUID());
const frodo = UserId.create(randomUUID());
const sam = UserId.create(randomUUID());
const campaignId = OwningCampaignId.create(randomUUID());

const NOW = TEST_INSTANT;
const NAME = CharacterName.create(A_CHARACTER_NAME);

function aCharacter(createdBy: UserId = gandalf): Character {
  return Character.start(campaignId, NAME, createdBy, NOW);
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

/** Le MJ créateur, qui a tous les droits sur ce qu'il vient d'ouvrir. */
const asCreator = contextFor({ actorId: gandalf, actorIsGameMaster: true });

function aRolledCharacter(): Character {
  const character = aCharacter();
  character.rollAbilities(STANDARD_ARRAY_ROLL, asCreator, NOW);

  return character;
}

function aReadyCharacter(): Character {
  const character = aRolledCharacter();
  character.finalize(A_CHARACTER_BUILD, asCreator, NOW);

  return character;
}

describe('Character.start', () => {
  it('naît en brouillon, non assigné, sans tirage ni fiche', () => {
    const character = aCharacter();

    expect(character.status).toBe('draft');
    expect(character.assignedTo).toBeNull();
    expect(character.abilityRoll).toBeNull();
    expect(character.build).toBeNull();
  });

  it('refuse de livrer une fiche tant qu il est un brouillon', () => {
    expect(() => aCharacter().assertIsReady()).toThrow(CharacterNotReadyError);
  });
});

describe('Character.rollAbilities', () => {
  it('pose le tirage sur le brouillon', () => {
    expect(aRolledCharacter().abilityRoll?.totals).toEqual([15, 14, 13, 12, 10, 8]);
  });

  it('laisse relancer tant que le personnage n est pas terminé', () => {
    const character = aRolledCharacter();

    expect(() =>
      character.rollAbilities(STANDARD_ARRAY_ROLL, asCreator, NOW),
    ).not.toThrow();
  });

  // Sinon un joueur retirerait jusqu'à obtenir six 18 en gardant sa fiche.
  it('refuse de relancer une fois le personnage terminé', () => {
    const character = aReadyCharacter();

    expect(() => character.rollAbilities(STANDARD_ARRAY_ROLL, asCreator, NOW)).toThrow(
      CharacterAlreadyReadyError,
    );
  });
});

describe('Character.finalize', () => {
  it('rend le personnage jouable et lui donne son build', () => {
    const character = aReadyCharacter();

    expect(character.status).toBe('ready');
    expect(character.build?.classKey).toBe('rogue');
    expect(() => character.assertIsReady()).not.toThrow();
  });

  it('refuse une copie rendue avant le lancer de dés', () => {
    expect(() => aCharacter().finalize(A_CHARACTER_BUILD, asCreator, NOW)).toThrow(
      AbilitiesNotRolledError,
    );
  });

  // L'invariant qui rend le tirage serveur utile.
  it('refuse des caractéristiques qui ne sortent pas du tirage', () => {
    const character = aRolledCharacter();
    const cheated = {
      ...A_CHARACTER_BUILD,
      base: {
        strength: 18,
        dexterity: 18,
        constitution: 18,
        intelligence: 18,
        wisdom: 18,
        charisma: 18,
      },
    };

    expect(() => character.finalize(cheated, asCreator, NOW)).toThrow(
      AbilityAssignmentMismatchError,
    );
  });

  it('refuse un nombre de compétences de classe qui ne colle pas', () => {
    const character = aRolledCharacter();
    const tooFewSkills = {
      ...A_CHARACTER_BUILD,
      choices: [{ source: { type: 'class' as const, key: 'rogue' }, skills: ['stealth' as const] }],
    };

    expect(() => character.finalize(tooFewSkills, asCreator, NOW)).toThrow(
      InvalidSkillChoiceError,
    );
  });

  it('refuse une espèce à lignage sans lignage choisi', () => {
    const character = aRolledCharacter();
    const missingLineage = { ...A_CHARACTER_BUILD, speciesKey: 'elf' as const };

    expect(() => character.finalize(missingLineage, asCreator, NOW)).toThrow(
      LineageRequiredError,
    );
  });

  it('refuse un acteur qui n a pas le droit d éditer', () => {
    const character = aRolledCharacter();

    expect(() =>
      character.finalize(A_CHARACTER_BUILD, contextFor({ actorId: sam }), NOW),
    ).toThrow(NotEditableByActorError);
  });
});

describe('Character.restore', () => {
  it('rend exactement ce qu il a reçu', () => {
    const snapshot = aReadyCharacter().snapshot();

    expect(Character.restore(snapshot).snapshot()).toEqual(snapshot);
  });
});

describe('Character.selfAssignToCreator', () => {
  it('assigne le personnage à son créateur', () => {
    const character = Character.start(campaignId, NAME, frodo, NOW);
    character.selfAssignToCreator(NOW);

    expect(character.assignedTo?.equals(frodo)).toBe(true);
  });
});

describe('Character.assignTo', () => {
  it('refuse un acteur qui n est pas maître du jeu', () => {
    expect(() => aCharacter().assignTo(false, frodo, NOW)).toThrow(
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

    expect(() => character.assertEditableBy(contextFor({ actorId: frodo }))).not.toThrow();
  });

  it('refuse un joueur sur un personnage qui ne lui est pas assigné', () => {
    const character = aCharacter(gandalf);

    expect(() => character.assertEditableBy(contextFor({ actorId: sam }))).toThrow(
      NotEditableByActorError,
    );
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
