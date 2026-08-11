import { randomUUID } from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { PlayerAlreadyHasCharacterError } from '../../domain/character.errors';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import {
  A_CHARACTER_CLASS,
  A_CHARACTER_NAME,
  A_CHARACTER_RACE,
  SOME_ABILITY_SCORES,
} from '../../testing/character.fixture';
import { CreateCharacterUseCase } from './create-character.use-case';

describe('CreateCharacterUseCase', () => {
  let campaignRepo: InMemoryCampaignRepository;
  let characterRepo: InMemoryCharacterRepository;
  let useCase: CreateCharacterUseCase;
  let gandalfId: string;
  let frodoId: string;
  let campaignId: string;
  let directory: InMemoryCharacterDirectory;

  beforeEach(async () => {
    campaignRepo = new InMemoryCampaignRepository();
    characterRepo = new InMemoryCharacterRepository();
    gandalfId = randomUUID();
    frodoId = randomUUID();

    const campaign = withPlayer(aCampaign(gandalfId), gandalfId, frodoId);
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;

    directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });
    useCase = new CreateCharacterUseCase(
      characterRepo,
      directory,
      new GetCampaignMembershipUseCase(campaignRepo),
      new FixedClock(),
    );
  });

  const dtoFor = (actorId: string) => ({
    campaignId,
    actorId: anActor(actorId),
    name: A_CHARACTER_NAME,
    race: A_CHARACTER_RACE,
    characterClass: A_CHARACTER_CLASS,
    abilityScores: SOME_ABILITY_SCORES,
  });

  it('assigne automatiquement au joueur la fiche qu il crée', async () => {
    const character = await useCase.execute(dtoFor(frodoId));

    expect(character.assignedTo).toEqual({ displayName: 'Frodo' });
  });

  it('refuse un second personnage pour le même joueur', async () => {
    await useCase.execute(dtoFor(frodoId));

    await expect(useCase.execute(dtoFor(frodoId))).rejects.toThrow(
      PlayerAlreadyHasCharacterError,
    );
  });

  it('laisse un maître du jeu créer un personnage non assigné', async () => {
    const character = await useCase.execute(dtoFor(gandalfId));

    expect(character.assignedTo).toBeNull();
  });
});
