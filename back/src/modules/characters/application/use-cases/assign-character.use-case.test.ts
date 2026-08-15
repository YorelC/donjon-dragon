import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { CharacterId } from '../../domain/character-id';
import {
  AlreadyAssignedToThisPlayerError,
  AssigneeNotFoundError,
  CharacterNotFoundError,
  NotAssignedError,
  OnlyGameMasterCanAssignError,
} from '../../domain/character.errors';
import { aCharacterBody } from '../../testing/character.fixture';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { AssignCharacterUseCase } from './assign-character.use-case';
import { CreateCharacterUseCase } from './create-character.use-case';
import { UnassignCharacterUseCase } from './unassign-character.use-case';

/**
 * L'attribution d'une fiche à un joueur : la seule opération du module réservée
 * au maître du jeu, et celle qui garantit qu'un joueur ne porte jamais deux
 * fiches à la fois.
 */
describe('Attribution d un personnage', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const samId = randomUUID();

  let assign: AssignCharacterUseCase;
  let unassign: UnassignCharacterUseCase;
  let create: CreateCharacterUseCase;
  let characterRepo: InMemoryCharacterRepository;
  let campaignId: string;

  beforeEach(async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId);
    withPlayer(campaign, gameMasterId, samId);
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;

    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: gameMasterId, displayName: 'Gandalf' });
    directory.register({ id: frodoId, displayName: 'Frodo' });
    directory.register({ id: samId, displayName: 'Sam' });

    const membership = new GetCampaignMembershipUseCase(campaignRepo);
    const clock = new FixedClock();
    characterRepo = new InMemoryCharacterRepository();
    create = new CreateCharacterUseCase(characterRepo, directory, membership, clock);
    assign = new AssignCharacterUseCase(characterRepo, directory, membership, clock);
    unassign = new UnassignCharacterUseCase(characterRepo, directory, membership, clock);
  });

  /** Créé par le MJ : il naît sans porteur, donc attribuable. */
  async function aFreeCharacter(name: string): Promise<string> {
    const character = await create.execute({
      ...aCharacterBody(name),
      campaignId,
      actorId: anActor(gameMasterId),
    });
    return character.id;
  }

  it('attribue un personnage libre au joueur nommé', async () => {
    const characterId = await aFreeCharacter('Grand-Pas');

    const result = await assign.execute({
      characterId,
      campaignId,
      actorId: anActor(gameMasterId),
      playerDisplayName: 'Frodo',
    });

    expect(result.assignedTo).toEqual({ displayName: 'Frodo' });
  });

  // La règle qui compte : un joueur ne décide pas de qui porte quoi.
  it('refuse l attribution par un joueur', async () => {
    const characterId = await aFreeCharacter('Grand-Pas');

    await expect(
      assign.execute({
        characterId,
        campaignId,
        actorId: anActor(frodoId),
        playerDisplayName: 'Sam',
      }),
    ).rejects.toThrow(OnlyGameMasterCanAssignError);
  });

  it('refuse une seconde attribution au même joueur', async () => {
    const characterId = await aFreeCharacter('Grand-Pas');
    const gameMaster = anActor(gameMasterId);
    await assign.execute({ characterId, campaignId, actorId: gameMaster, playerDisplayName: 'Frodo' });

    await expect(
      assign.execute({ characterId, campaignId, actorId: gameMaster, playerDisplayName: 'Frodo' }),
    ).rejects.toThrow(AlreadyAssignedToThisPlayerError);
  });

  // Un joueur ne porte qu'une fiche : la précédente rejoint le pool.
  it('libère la fiche que le joueur portait déjà', async () => {
    const gameMaster = anActor(gameMasterId);
    const first = await aFreeCharacter('Grand-Pas');
    const second = await aFreeCharacter('Bilbon');
    await assign.execute({ characterId: first, campaignId, actorId: gameMaster, playerDisplayName: 'Frodo' });

    await assign.execute({ characterId: second, campaignId, actorId: gameMaster, playerDisplayName: 'Frodo' });

    const released = await characterRepo.findById(CharacterId.create(first));
    expect(released?.assignedTo).toBeNull();
  });

  it('refuse un joueur inconnu de l annuaire', async () => {
    const characterId = await aFreeCharacter('Grand-Pas');

    await expect(
      assign.execute({
        characterId,
        campaignId,
        actorId: anActor(gameMasterId),
        playerDisplayName: 'Sauron',
      }),
    ).rejects.toThrow(AssigneeNotFoundError);
  });

  it('refuse un personnage inconnu', async () => {
    await expect(
      assign.execute({
        characterId: randomUUID(),
        campaignId,
        actorId: anActor(gameMasterId),
        playerDisplayName: 'Frodo',
      }),
    ).rejects.toThrow(CharacterNotFoundError);
  });

  describe('retrait', () => {
    it('rend au pool un personnage attribué', async () => {
      const characterId = await aFreeCharacter('Grand-Pas');
      const gameMaster = anActor(gameMasterId);
      await assign.execute({ characterId, campaignId, actorId: gameMaster, playerDisplayName: 'Frodo' });

      const result = await unassign.execute({ characterId, campaignId, actorId: gameMaster });

      expect(result.assignedTo).toBeNull();
    });

    it('refuse le retrait par le joueur qui porte la fiche', async () => {
      const characterId = await aFreeCharacter('Grand-Pas');
      await assign.execute({
        characterId,
        campaignId,
        actorId: anActor(gameMasterId),
        playerDisplayName: 'Frodo',
      });

      await expect(
        unassign.execute({ characterId, campaignId, actorId: anActor(frodoId) }),
      ).rejects.toThrow(OnlyGameMasterCanAssignError);
    });

    it('refuse le retrait d une fiche que personne ne porte', async () => {
      const characterId = await aFreeCharacter('Grand-Pas');

      await expect(
        unassign.execute({ characterId, campaignId, actorId: anActor(gameMasterId) }),
      ).rejects.toThrow(NotAssignedError);
    });
  });
});
