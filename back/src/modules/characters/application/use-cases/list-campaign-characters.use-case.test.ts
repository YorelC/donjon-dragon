import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import {
  aCampaign,
  withPlayer,
} from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { CharacterId } from '../../domain/character-id';
import { CharacterNotFoundError } from '../../domain/character.errors';
import { aCharacterBody, seedAbilityRoll } from '../../testing/character.fixture';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { UserId } from '@kernel/domain/user-id';

import { InMemoryAbilityRollRepository } from '../../testing/in-memory-ability-roll.repository';
import { InMemoryCharacterCreationRepository } from '../../testing/in-memory-character-creation.repository';
import { CreateCharacterUseCase } from './create-character.use-case';
import { ListCampaignCharactersUseCase } from './list-campaign-characters.use-case';

/**
 * La table se montre aux joueurs de la table. L'id de campagne vient du client :
 * sans contrôle d'appartenance, il désignerait n'importe quelle campagne.
 */
describe('ListCampaignCharactersUseCase', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const samId = randomUUID();
  const inviteeId = randomUUID();

  let useCase: ListCampaignCharactersUseCase;
  let characterRepo: InMemoryCharacterRepository;
  let create: CreateCharacterUseCase;
  let directory: InMemoryCharacterDirectory;
  let campaignId: string;

  beforeEach(async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = withPlayer(
      withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId), gameMasterId, samId,
    );
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;

    directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });
    directory.register({ id: samId, displayName: 'Sam' });
    directory.register({ id: gameMasterId, displayName: 'Gandalf' });

    const membership = new GetCampaignMembershipUseCase(campaignRepo);
    characterRepo = new InMemoryCharacterRepository();
    const rolls = new InMemoryAbilityRollRepository();
    [frodoId, samId, gameMasterId].forEach((userId) =>
      seedAbilityRoll(rolls, UserId.create(userId), campaignId));
    create = new CreateCharacterUseCase(
      characterRepo,
      directory,
      new InMemoryItemCatalog(),
      membership,
      new FixedClock(),
      new InMemoryCharacterCreationRepository(characterRepo),
      rolls,
    );
    await create.execute({
      ...aCharacterBody(),
      campaignId,
      actorId: anActor(frodoId),
      idempotencyKey: randomUUID(),
    });

    useCase = new ListCampaignCharactersUseCase(characterRepo, directory, membership);
  });

  function createFor(creatorId: string, name: string) {
    return create.execute({
      ...aCharacterBody(name), campaignId, actorId: anActor(creatorId),
      idempotencyKey: randomUUID(),
    });
  }

  // DR-007-07 : ni le vivier, ni le personnage d'un autre joueur.
  it('ne rend au joueur que son personnage assigné', async () => {
    await createFor(gameMasterId, 'Bilbon');
    await createFor(samId, 'Sam');

    const characters = await useCase.execute({ campaignId, actorId: anActor(frodoId) });

    expect(characters).toHaveLength(1);
    expect(characters[0]).toMatchObject({
      projection: 'controlled',
      personalDetails: {
        personalityTraits: 'Curieux et prudent.',
        ideals: 'La liberté avant tout.',
        bonds: 'Protéger ses compagnons.',
        flaws: null,
      },
    });
  });

  it('rend une liste vide au joueur sans personnage', async () => {
    await createFor(gameMasterId, 'Bilbon');

    await expect(useCase.execute({ campaignId, actorId: anActor(samId) }))
      .resolves.toEqual([]);
  });

  it('rend au joueur le personnage qu un MJ lui a attribué', async () => {
    const created = await createFor(gameMasterId, 'Bilbon');
    const character = await characterRepo.findById(CharacterId.create(created.id));
    character?.assignTo(true, UserId.create(samId), TEST_INSTANT);
    if (character) await characterRepo.save(character);

    const characters = await useCase.execute({ campaignId, actorId: anActor(samId) });

    expect(characters).toEqual([expect.objectContaining({ id: created.id, name: 'Bilbon' })]);
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

  // Le N+1 corrigé : la lecture d'annuaire ne suit plus le nombre de fiches.
  it('résout les joueurs assignés en une seule lecture d annuaire', async () => {
    await create.execute({
      ...aCharacterBody('Bilbon'), campaignId, actorId: anActor(gameMasterId),
      idempotencyKey: randomUUID(),
    });
    directory.resetLookupCount();

    const characters = await useCase.execute({
      campaignId, actorId: anActor(gameMasterId),
    });

    expect(characters).toHaveLength(2);
    expect(directory.batchLookupCount).toBe(1);
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
