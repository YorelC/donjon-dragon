import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import {
  aCampaign,
  withPlayer,
} from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { CharacterNotFoundError } from '../../domain/character.errors';
import { aCharacterBody } from '../../testing/character.fixture';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { CreateCharacterUseCase } from './create-character.use-case';
import { ListCampaignCharactersUseCase } from './list-campaign-characters.use-case';

/**
 * La table se montre aux joueurs de la table. L'id de campagne vient du client :
 * sans contrôle d'appartenance, il désignerait n'importe quelle campagne.
 */
describe('ListCampaignCharactersUseCase', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const inviteeId = randomUUID();

  let useCase: ListCampaignCharactersUseCase;
  let create: CreateCharacterUseCase;
  let campaignId: string;

  beforeEach(async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId);
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;

    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });

    const membership = new GetCampaignMembershipUseCase(campaignRepo);
    const characterRepo = new InMemoryCharacterRepository();
    create = new CreateCharacterUseCase(
      characterRepo,
      directory,
      new InMemoryItemCatalog(),
      membership,
      new FixedClock(),
    );
    await create.execute({
      ...aCharacterBody(),
      campaignId,
      actorId: anActor(frodoId),
    });

    useCase = new ListCampaignCharactersUseCase(characterRepo, directory, membership);
  });

  it('ne livre aucun champ privé des autres personnages au joueur', async () => {
    await create.execute({
      ...aCharacterBody('Bilbon'), campaignId, actorId: anActor(gameMasterId),
    });
    const characters = await useCase.execute({ campaignId, actorId: anActor(frodoId) });
    const controlled = characters.find((item) => item.projection === 'controlled');
    const pool = characters.find((item) => item.projection === 'pool');
    expect(controlled).toMatchObject({ projection: 'controlled' });
    expect(pool).toMatchObject({ projection: 'pool', assignmentStatus: 'available' });
    expect(pool).not.toHaveProperty('build');
    expect(pool).not.toHaveProperty('assignedTo');
    expect(pool).not.toHaveProperty('revision');
  });

  it('rend les personnages de la campagne à un membre actif', async () => {
    const characters = await useCase.execute({
      campaignId,
      actorId: anActor(gameMasterId),
    });

    expect(characters).toHaveLength(1);
    expect(characters[0]).toMatchObject({
      projection: 'gameMaster',
      assignedTo: { displayName: 'Frodo' },
    });
  });

  // Le cas qui motive le contrôle : un id de campagne se devine, une session non.
  it('refuse un utilisateur étranger à la campagne', async () => {
    await expect(
      useCase.execute({ campaignId, actorId: anActor(randomUUID()) }),
    ).rejects.toThrow(CharacterNotFoundError);
  });

  it('refuse un invité qui n a pas encore répondu', async () => {
    await expect(
      useCase.execute({ campaignId, actorId: anActor(inviteeId) }),
    ).rejects.toThrow(CharacterNotFoundError);
  });
});
