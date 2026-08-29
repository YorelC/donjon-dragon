import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import {
  CharacterNotFoundError,
  NotEditableByActorError,
  UnknownItemError,
} from '../../domain/character.errors';
import { aCharacterBody } from '../../testing/character.fixture';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { CreateCharacterUseCase } from './create-character.use-case';
import { FinalizeCharacterUseCase } from './finalize-character.use-case';

/**
 * L'édition d'une fiche déjà persistée : montée de niveau ou correction. Elle
 * rejoue les vérifications de build, mais c'est l'autorisation qui est testée
 * ici — le moteur de résolution a ses propres tests.
 */
describe('FinalizeCharacterUseCase', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const samId = randomUUID();

  let useCase: FinalizeCharacterUseCase;
  let create: CreateCharacterUseCase;
  let campaignId: string;

  beforeEach(async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId);
    withPlayer(campaign, gameMasterId, samId);
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;

    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });

    const membership = new GetCampaignMembershipUseCase(campaignRepo);
    const memberships = new GetCampaignMembershipsUseCase(campaignRepo);
    const characterRepo = new InMemoryCharacterRepository();
    const clock = new FixedClock();
    create = new CreateCharacterUseCase(
      characterRepo,
      directory,
      new InMemoryItemCatalog(),
      membership,
      clock,
    );
    useCase = new FinalizeCharacterUseCase(
      characterRepo,
      directory,
      new InMemoryItemCatalog(),
      memberships,
      clock,
    );
  });

  async function characterCreatedBy(creatorId: string): Promise<string> {
    const character = await create.execute({
      ...aCharacterBody(),
      campaignId,
      actorId: anActor(creatorId),
    });
    return character.id;
  }

  it('laisse le joueur retoucher la fiche qu il porte', async () => {
    const characterId = await characterCreatedBy(frodoId);

    const result = await useCase.execute({
      ...aCharacterBody('Frodon Sacquet'),
      characterId,
      campaignId,
      actorId: anActor(frodoId),
    });

    expect(result.name).toBe('Frodon Sacquet');
  });

  it('laisse le MJ retoucher la fiche créée par un joueur', async () => {
    const characterId = await characterCreatedBy(frodoId);

    const result = await useCase.execute({
      ...aCharacterBody('Frodon le Neuf'),
      characterId,
      campaignId,
      actorId: anActor(gameMasterId),
    });

    expect(result.name).toBe('Frodon le Neuf');
  });

  // Le cas IDOR : un autre joueur de la même campagne n'est pas plus légitime
  // qu'un inconnu sur une fiche qu'il ne porte pas.
  it('refuse à un autre joueur la fiche qu il ne porte pas', async () => {
    const characterId = await characterCreatedBy(frodoId);

    await expect(
      useCase.execute({
        ...aCharacterBody('Détourné'),
        characterId,
        campaignId,
        actorId: anActor(samId),
      }),
    ).rejects.toThrow(NotEditableByActorError);
  });

  it('refuse un personnage inconnu', async () => {
    await expect(
      useCase.execute({
        ...aCharacterBody(),
        characterId: randomUUID(),
        campaignId,
        actorId: anActor(gameMasterId),
      }),
    ).rejects.toThrow(CharacterNotFoundError);
  });

  // Le catalogue d'objets vit dans une collection : le domaine ne peut pas
  // vérifier une clé, c'est le use-case qui le fait avant de toucher l'agrégat.
  it('refuse un objet que le catalogue ne connaît pas', async () => {
    const characterId = await characterCreatedBy(frodoId);

    await expect(
      useCase.execute({
        ...aCharacterBody(),
        equipment: {
          armorKey: 'leather',
          shield: false,
          items: [{ itemKey: 'epee-de-mon-invention', quantity: 1 }],
          gold: 0,
          classOptionId: 'A',
          backgroundOptionId: 'A',
        },
        characterId,
        campaignId,
        actorId: anActor(frodoId),
      }),
    ).rejects.toThrow(UnknownItemError);
  });

  // Un refus d'autorisation ne doit rien laisser derrière lui : le renommage
  // précède le build dans le use-case, et il doit tomber avec le reste.
  it('ne renomme rien quand l édition est refusée', async () => {
    const characterId = await characterCreatedBy(frodoId);

    await expect(
      useCase.execute({
        ...aCharacterBody('Détourné'),
        characterId,
        campaignId,
        actorId: anActor(samId),
      }),
    ).rejects.toThrow(NotEditableByActorError);

    const reread = await useCase.execute({
      ...aCharacterBody('Frodon Sacquet'),
      characterId,
      campaignId,
      actorId: anActor(frodoId),
    });
    expect(reread.name).toBe('Frodon Sacquet');
  });
});
