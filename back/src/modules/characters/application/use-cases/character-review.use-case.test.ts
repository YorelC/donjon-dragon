import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { GetCampaignMembershipsUseCase } from '@modules/campaigns/application/use-cases/get-campaign-memberships.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';

import {
  CharacterReviewCommandConflictError,
  OnlyGameMasterCanReviewError,
} from '../../domain/character.errors';
import { aCharacterBody, seedAbilityRoll } from '../../testing/character.fixture';
import { InMemoryAbilityRollRepository } from '../../testing/in-memory-ability-roll.repository';
import { InMemoryCharacterCommandRepository } from '../../testing/in-memory-character-command.repository';
import { InMemoryCharacterCreationRepository } from '../../testing/in-memory-character-creation.repository';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { AcceptCharacterReviewUseCase } from './accept-character-review.use-case';
import { CreateCharacterUseCase } from './create-character.use-case';
import { RefuseCharacterReviewUseCase } from './refuse-character-review.use-case';
import { SubmitCharacterForReviewUseCase } from './submit-character-for-review.use-case';

describe('Character review use cases', () => {
  const gameMasterId = randomUUID();
  const playerId = randomUUID();
  let campaignId: string;
  let create: CreateCharacterUseCase;
  let submit: SubmitCharacterForReviewUseCase;
  let accept: AcceptCharacterReviewUseCase;
  let refuse: RefuseCharacterReviewUseCase;
  let commands: InMemoryCharacterCommandRepository;

  beforeEach(async () => {
    const campaignRepo = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, playerId);
    await campaignRepo.save(campaign);
    campaignId = campaign.id.value;
    const repositories = reviewRepositories(campaignRepo);
    ({ create, submit, accept, refuse, commands } = repositories);
  });

  it('soumet une version immuable et rejoue la même commande', async () => {
    const characterId = await createForPlayer();
    const command = reviewCommand(characterId, playerId, 1);

    const first = await submit.execute(command);
    const replay = await submit.execute(command);

    expect(first).toEqual(replay);
    expect(first.review).toMatchObject({ status: 'submitted', submittedVersion: 1 });
    expect(commands.actions).toEqual(['character.submitted']);
    expect(commands.versions).toHaveLength(1);
  });

  it('refuse la réutilisation de la clé pour une autre intention', async () => {
    const characterId = await createForPlayer();
    const command = reviewCommand(characterId, playerId, 1);
    await submit.execute(command);

    await expect(submit.execute({ ...command, expectedRevision: 2 })).rejects.toThrow(
      CharacterReviewCommandConflictError,
    );
  });

  it('réserve la décision au MJ et restitue son motif au propriétaire', async () => {
    const characterId = await createForPlayer();
    await submit.execute(reviewCommand(characterId, playerId, 1));

    await expect(accept.execute(reviewCommand(characterId, playerId, 2))).rejects.toThrow(
      OnlyGameMasterCanReviewError,
    );
    const result = await refuse.execute({
      ...reviewCommand(characterId, gameMasterId, 2),
      reason: '  Revoir les compétences.  ',
    });

    expect(result.review).toMatchObject({
      status: 'refused',
      lastRejectionReason: 'Revoir les compétences.',
    });
    expect(commands.actions).toEqual(['character.submitted', 'character.refused']);
  });

  async function createForPlayer(): Promise<string> {
    const character = await create.execute({
      ...aCharacterBody(), campaignId, actorId: anActor(playerId), idempotencyKey: randomUUID(),
    });
    return character.id;
  }

  function reviewCommand(characterId: string, actorId: string, expectedRevision: number) {
    return {
      campaignId, characterId, actorId: anActor(actorId), expectedRevision,
      idempotencyKey: randomUUID(),
    };
  }

  function reviewRepositories(campaignRepo: InMemoryCampaignRepository) {
    const characters = new InMemoryCharacterRepository();
    const commandRepository = new InMemoryCharacterCommandRepository(characters);
    const membership = new GetCampaignMembershipUseCase(campaignRepo);
    const memberships = new GetCampaignMembershipsUseCase(campaignRepo);
    const clock = new FixedClock();
    const rolls = new InMemoryAbilityRollRepository();
    seedAbilityRoll(rolls, UserId.create(playerId), campaignId);
    return {
      commands: commandRepository,
      create: new CreateCharacterUseCase(
        characters, new InMemoryCharacterDirectory(), new InMemoryItemCatalog(), membership,
        clock, new InMemoryCharacterCreationRepository(characters), rolls,
      ),
      submit: new SubmitCharacterForReviewUseCase(characters, commandRepository, memberships, clock),
      accept: new AcceptCharacterReviewUseCase(
        characters, commandRepository, membership, memberships, clock,
      ),
      refuse: new RefuseCharacterReviewUseCase(
        characters, commandRepository, membership, memberships, clock,
      ),
    };
  }
});
