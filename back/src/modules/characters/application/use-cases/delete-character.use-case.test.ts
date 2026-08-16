import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';

import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { CharacterId } from '../../domain/character-id';
import {
  CharacterNotFoundError,
  NotEditableByActorError,
} from '../../domain/character.errors';
import { aCharacterBody } from '../../testing/character.fixture';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { CreateCharacterUseCase } from './create-character.use-case';
import { DeleteCharacterUseCase } from './delete-character.use-case';

/**
 * La suppression passe par `assertEditableBy` : c'est la même matrice d'accès
 * que l'édition, sur l'opération la moins réversible du module.
 *
 * Le propriétaire de la campagne est aussi son premier MJ ; `secondMaster` est
 * un MJ promu, ce qui permet de tester le cas « MJ face à la fiche d'un autre
 * MJ », celui que le propriétaire seul peut trancher.
 */
describe('DeleteCharacterUseCase', () => {
  const ownerId = randomUUID();
  const secondMasterId = randomUUID();
  const frodoId = randomUUID();

  let useCase: DeleteCharacterUseCase;
  let create: CreateCharacterUseCase;
  let characterRepo: InMemoryCharacterRepository;
  let campaignId: string;

  beforeEach(async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(ownerId), ownerId, frodoId);
    withPlayer(campaign, ownerId, secondMasterId);
    campaign.promote(UserId.create(ownerId), UserId.create(secondMasterId), TEST_INSTANT);
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;

    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });

    const membership = new GetCampaignMembershipUseCase(campaignRepo);
    characterRepo = new InMemoryCharacterRepository();
    create = new CreateCharacterUseCase(
      characterRepo,
      directory,
      new InMemoryItemCatalog(),
      membership,
      new FixedClock(),
    );
    useCase = new DeleteCharacterUseCase(characterRepo, membership);
  });

  async function characterCreatedBy(creatorId: string): Promise<string> {
    const character = await create.execute({
      ...aCharacterBody(),
      campaignId,
      actorId: anActor(creatorId),
    });
    return character.id;
  }

  async function stillExists(characterId: string): Promise<boolean> {
    return !!(await characterRepo.findById(CharacterId.create(characterId)));
  }

  it('laisse un joueur supprimer la fiche qu il porte', async () => {
    const characterId = await characterCreatedBy(frodoId);

    await useCase.execute({ characterId, campaignId, actorId: anActor(frodoId) });

    expect(await stillExists(characterId)).toBe(false);
  });

  it('laisse un MJ supprimer la fiche créée par un joueur', async () => {
    const characterId = await characterCreatedBy(frodoId);

    await useCase.execute({ characterId, campaignId, actorId: anActor(secondMasterId) });

    expect(await stillExists(characterId)).toBe(false);
  });

  // Le cas IDOR : un joueur de la campagne, mais pas celui de cette fiche.
  it('refuse à un joueur la fiche qu il ne porte pas', async () => {
    const strangerId = randomUUID();
    const characterId = await characterCreatedBy(frodoId);

    await expect(
      useCase.execute({ characterId, campaignId, actorId: anActor(strangerId) }),
    ).rejects.toThrow(NotEditableByActorError);
    expect(await stillExists(characterId)).toBe(true);
  });

  // Le propriétaire tranche : c'est la seule voie de recours sur la fiche libre
  // d'un autre MJ, sinon elle deviendrait insupprimable.
  it('laisse le propriétaire supprimer la fiche libre d un autre MJ', async () => {
    const characterId = await characterCreatedBy(secondMasterId);

    await useCase.execute({ characterId, campaignId, actorId: anActor(ownerId) });

    expect(await stillExists(characterId)).toBe(false);
  });

  it('refuse au MJ promu la fiche libre du propriétaire', async () => {
    const characterId = await characterCreatedBy(ownerId);

    await expect(
      useCase.execute({ characterId, campaignId, actorId: anActor(secondMasterId) }),
    ).rejects.toThrow(NotEditableByActorError);
    expect(await stillExists(characterId)).toBe(true);
  });

  it('refuse un personnage inconnu', async () => {
    await expect(
      useCase.execute({
        characterId: randomUUID(),
        campaignId,
        actorId: anActor(ownerId),
      }),
    ).rejects.toThrow(CharacterNotFoundError);
  });
});
