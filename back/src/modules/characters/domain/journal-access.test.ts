import { randomUUID } from 'crypto';
import { describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { STANDARD_ARRAY_ROLL } from '../testing/character-build.fixture';
import {
  A_CHARACTER_BUILD,
  A_CHARACTER_IDENTITY,
  A_CHARACTER_NAME,
} from '../testing/character.fixture';
import { Character } from './character';
import { CharacterName } from './character-name';
import { CharacterNotFoundError } from './character.errors';
import { assertJournalWriter, journalAccessOf } from './journal-access';
import { JournalNotWritableError } from './journal-chapter.errors';
import { OwningCampaignId } from './owning-campaign-id';

const gandalf = UserId.create(randomUUID());
const frodo = UserId.create(randomUUID());
const sam = UserId.create(randomUUID());

function aCharacter(): Character {
  return Character.create({
    campaignId: OwningCampaignId.create(randomUUID()),
    name: CharacterName.create(A_CHARACTER_NAME),
    identity: A_CHARACTER_IDENTITY,
    createdBy: gandalf,
    build: A_CHARACTER_BUILD,
    roll: STANDARD_ARRAY_ROLL,
    now: TEST_INSTANT,
  });
}

function assignedTo(player: UserId): Character {
  const character = aCharacter();
  character.assignTo(true, player, TEST_INSTANT);
  return character;
}

const asGameMaster = { actorId: gandalf, actorIsGameMaster: true };

describe('journalAccessOf', () => {
  it('laisse le joueur assigné écrire son journal', () => {
    expect(journalAccessOf(assignedTo(frodo), { actorId: frodo, actorIsGameMaster: false }))
      .toBe('writer');
  });

  it('laisse un MJ lire, sans écrire, le journal d’un personnage qui a son joueur', () => {
    const access = journalAccessOf(assignedTo(frodo), asGameMaster);

    expect(access).toBe('reader');
    expect(() => assertJournalWriter(access)).toThrow(JournalNotWritableError);
  });

  it('laisse un MJ écrire le journal d’un personnage sans joueur', () => {
    expect(journalAccessOf(aCharacter(), asGameMaster)).toBe('writer');
  });

  it('masque le journal à un autre joueur, comme la fiche', () => {
    expect(() => journalAccessOf(assignedTo(frodo), { actorId: sam, actorIsGameMaster: false }))
      .toThrow(CharacterNotFoundError);
  });

  it('donne le journal au nouveau joueur d’un personnage réattribué', () => {
    const character = assignedTo(frodo);
    character.reclaimBy({ id: gandalf, isGameMaster: true }, TEST_INSTANT);
    character.assignTo(true, sam, TEST_INSTANT);

    expect(journalAccessOf(character, { actorId: sam, actorIsGameMaster: false })).toBe('writer');
    expect(() => journalAccessOf(character, { actorId: frodo, actorIsGameMaster: false }))
      .toThrow(CharacterNotFoundError);
  });
});
