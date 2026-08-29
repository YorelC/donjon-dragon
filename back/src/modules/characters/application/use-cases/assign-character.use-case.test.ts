import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'crypto';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { CampaignNotFoundError } from '@modules/campaigns/domain/campaign.errors';

import { CharacterId } from '../../domain/character-id';
import {
  AssigneeIsNotActivePlayerError,
  AssigneeNotFoundError,
  CharacterAssignedToAnotherPlayerError,
  CharacterAssignmentCommandConflictError,
  CharacterRevisionConflictError,
  NotAssignedError,
  OnlyGameMasterCanAssignError,
} from '../../domain/character.errors';
import { aCharacterBody } from '../../testing/character.fixture';
import { InMemoryCharacterAssignmentRepository } from '../../testing/in-memory-character-assignment.repository';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { AssignCharacterUseCase } from './assign-character.use-case';
import { CreateCharacterUseCase } from './create-character.use-case';
import { UnassignCharacterUseCase } from './unassign-character.use-case';

describe('attribution transactionnelle d un personnage', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const samId = randomUUID();
  const outsiderId = randomUUID();
  let assign: AssignCharacterUseCase;
  let unassign: UnassignCharacterUseCase;
  let create: CreateCharacterUseCase;
  let characters: InMemoryCharacterRepository;
  let assignments: InMemoryCharacterAssignmentRepository;
  let directory: InMemoryCharacterDirectory;
  let campaignId: string;

  beforeEach(async () => {
    const campaigns = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId);
    withPlayer(campaign, gameMasterId, samId);
    await campaigns.save(campaign);
    campaignId = campaign.id.value;
    directory = new InMemoryCharacterDirectory();
    registerUsers();
    const membership = new GetCampaignMembershipUseCase(campaigns);
    characters = new InMemoryCharacterRepository();
    assignments = new InMemoryCharacterAssignmentRepository(characters);
    const clock = new FixedClock();
    create = new CreateCharacterUseCase(
      characters, directory, new InMemoryItemCatalog(), membership, clock,
    );
    assign = new AssignCharacterUseCase(
      characters, assignments, directory, membership, clock,
    );
    unassign = new UnassignCharacterUseCase(
      characters, assignments, membership, clock,
    );
  });

  it('attribue nominalement et enveloppe la commande', async () => {
    const character = await freeCharacter('Grand-Pas');
    const result = await assign.execute(assignCommand(character.id, 'Frodo'));
    expect(result.character.assignedTo).toEqual({ displayName: 'Frodo' });
    expect(assignments.facts).toEqual(['character.assigned']);
    expect(assignments.audits).toHaveLength(1);
  });

  it('remplace atomiquement le personnage précédent', async () => {
    const first = await freeCharacter('Grand-Pas');
    const second = await freeCharacter('Bilbon');
    await assign.execute(assignCommand(first.id, 'Frodo'));
    const result = await assign.execute(assignCommand(second.id, 'Frodo'));
    expect(result.previousCharacter?.id).toBe(first.id);
    expect((await characters.findById(CharacterId.create(first.id)))?.assignedTo).toBeNull();
    expect(assignments.facts).toEqual([
      'character.assigned', 'character.unassigned', 'character.assigned',
    ]);
  });

  it('refuse un acteur joueur avant de résoudre le pseudo', async () => {
    const character = await freeCharacter('Grand-Pas');
    directory.resetLookupCount();
    await expect(assign.execute({
      ...assignCommand(character.id, 'Inconnu'), actorId: anActor(frodoId),
    })).rejects.toThrow(OnlyGameMasterCanAssignError);
    expect(directory.displayNameLookupCount).toBe(0);
  });

  it('refuse une cible extérieure ou MJ', async () => {
    const character = await freeCharacter('Grand-Pas');
    await expect(assign.execute(assignCommand(character.id, 'Sauron')))
      .rejects.toThrow(AssigneeIsNotActivePlayerError);
    await expect(assign.execute(assignCommand(character.id, 'Gandalf')))
      .rejects.toThrow(AssigneeIsNotActivePlayerError);
  });

  it('refuse un pseudo absent', async () => {
    const character = await freeCharacter('Grand-Pas');
    await expect(assign.execute(assignCommand(character.id, 'Inconnu')))
      .rejects.toThrow(AssigneeNotFoundError);
  });

  it('masque un personnage appartenant à une autre campagne', async () => {
    const character = await freeCharacter('Grand-Pas');
    await expect(assign.execute({
      ...assignCommand(character.id, 'Frodo'), campaignId: randomUUID(),
    })).rejects.toThrow(CampaignNotFoundError);
  });

  it('refuse le transfert implicite entre joueurs', async () => {
    const character = await freeCharacter('Grand-Pas');
    await assign.execute(assignCommand(character.id, 'Frodo'));
    const persisted = await characters.findById(CharacterId.create(character.id));
    await expect(assign.execute({
      ...assignCommand(character.id, 'Sam'), expectedRevision: persisted!.revision,
    })).rejects.toThrow(CharacterAssignedToAnotherPlayerError);
  });

  it('refuse une révision obsolète', async () => {
    const character = await freeCharacter('Grand-Pas');
    await expect(assign.execute({
      ...assignCommand(character.id, 'Frodo'), expectedRevision: character.revision + 1,
    })).rejects.toThrow(CharacterRevisionConflictError);
  });

  it('rejoue sans nouvel effet et rejette une intention divergente', async () => {
    const character = await freeCharacter('Grand-Pas');
    const command = assignCommand(character.id, 'Frodo');
    const first = await assign.execute(command);
    expect(await assign.execute(command)).toEqual(first);
    expect(assignments.facts).toHaveLength(1);
    await expect(assign.execute({ ...command, playerDisplayName: 'Sam' }))
      .rejects.toThrow(CharacterAssignmentCommandConflictError);
  });

  it('désattribue uniquement par un MJ avec révision et enveloppe', async () => {
    const character = await freeCharacter('Grand-Pas');
    const assigned = await assign.execute(assignCommand(character.id, 'Frodo'));
    const command = unassignCommand(character.id, assigned.character.revision);
    const result = await unassign.execute(command);
    expect(result.character.assignedTo).toBeNull();
    expect(await unassign.execute(command)).toEqual(result);
  });

  it('refuse désattribution joueur et personnage libre', async () => {
    const character = await freeCharacter('Grand-Pas');
    await expect(unassign.execute({
      ...unassignCommand(character.id, character.revision), actorId: anActor(frodoId),
    })).rejects.toThrow(OnlyGameMasterCanAssignError);
    await expect(unassign.execute(unassignCommand(character.id, character.revision)))
      .rejects.toThrow(NotAssignedError);
  });

  async function freeCharacter(name: string) {
    return create.execute({ ...aCharacterBody(name), campaignId, actorId: anActor(gameMasterId) });
  }

  function assignCommand(characterId: string, playerDisplayName: string) {
    return {
      characterId, campaignId, actorId: anActor(gameMasterId), playerDisplayName,
      expectedRevision: 0, idempotencyKey: randomUUID(),
    };
  }

  function unassignCommand(characterId: string, expectedRevision: number) {
    return {
      characterId, campaignId, actorId: anActor(gameMasterId), expectedRevision,
      idempotencyKey: randomUUID(),
    };
  }

  function registerUsers(): void {
    directory.register({ id: gameMasterId, displayName: 'Gandalf' });
    directory.register({ id: frodoId, displayName: 'Frodo' });
    directory.register({ id: samId, displayName: 'Sam' });
    directory.register({ id: outsiderId, displayName: 'Sauron' });
  }
});
