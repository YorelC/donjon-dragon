import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';
import { LeaveCampaignUseCase } from '@modules/campaigns/application/use-cases/leave-campaign.use-case';
import { ExcludeCampaignMemberUseCase } from '@modules/campaigns/application/use-cases/exclude-campaign-member.use-case';
import { PromoteCampaignMemberUseCase } from '@modules/campaigns/application/use-cases/promote-campaign-member.use-case';
import { InMemoryCampaignDirectory } from '@modules/campaigns/testing/in-memory-campaign-directory';
import { InMemoryCampaignLifecycleRepository } from '@modules/campaigns/testing/in-memory-campaign-lifecycle.repository';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';

import { Character } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import { OwningCampaignId } from '../../domain/owning-campaign-id';
import { STANDARD_ARRAY_ROLL } from '../../testing/character-build.fixture';
import { A_CHARACTER_BUILD } from '../../testing/character.fixture';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { LeaveCampaignWithCharacterUseCase } from './leave-campaign-with-character.use-case';
import { ExcludeCampaignMemberWithCharacterUseCase } from './exclude-campaign-member-with-character.use-case';
import { PromoteCampaignMemberWithCharacterUseCase } from './promote-campaign-member-with-character.use-case';

describe('coordination atomique campagne et personnage', () => {
  let campaigns: InMemoryCampaignRepository;
  let characters: InMemoryCharacterRepository;
  let promote: PromoteCampaignMemberWithCharacterUseCase;
  let leave: LeaveCampaignWithCharacterUseCase;
  let exclude: ExcludeCampaignMemberWithCharacterUseCase;
  let ownerId: string;
  let playerId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    characters = new InMemoryCharacterRepository();
    const directory = new InMemoryCampaignDirectory();
    const lifecycle = new InMemoryCampaignLifecycleRepository(campaigns);
    const clock = new FixedClock();
    const campaignPromote = new PromoteCampaignMemberUseCase(
      campaigns,
      lifecycle,
      directory,
      clock,
    );
    const campaignLeave = new LeaveCampaignUseCase(
      campaigns,
      lifecycle,
      directory,
      clock,
    );
    const campaignExclude = new ExcludeCampaignMemberUseCase(
      campaigns,
      lifecycle,
      directory,
      clock,
    );
    promote = new PromoteCampaignMemberWithCharacterUseCase(campaignPromote, characters);
    leave = new LeaveCampaignWithCharacterUseCase(campaignLeave, characters);
    exclude = new ExcludeCampaignMemberWithCharacterUseCase(
      campaignExclude,
      characters,
    );
    ownerId = randomUUID();
    playerId = randomUUID();
    directory.save({ id: ownerId, displayName: 'Gandalf' });
    directory.save({ id: playerId, displayName: 'Frodon' });
  });

  it('désassigne le personnage dans la promotion', async () => {
    const state = await campaignAndAssignedCharacter();
    const result = await promote.execute({
      campaignId: state.campaign.id.value,
      displayName: 'Frodon',
      expectedRevision: state.campaign.revision,
      actorId: anActor(ownerId),
      idempotencyKey: randomUUID(),
    });

    expect((await characters.findById(state.character.id))?.assignedTo).toBeNull();
    expect(result.target?.role).toBe('gameMaster');
  });

  it('désassigne le personnage dans le départ volontaire', async () => {
    const state = await campaignAndAssignedCharacter();
    await leave.execute({
      campaignId: state.campaign.id.value,
      expectedRevision: state.campaign.revision,
      actorId: anActor(playerId),
      idempotencyKey: randomUUID(),
    });

    expect((await characters.findById(state.character.id))?.assignedTo).toBeNull();
  });

  it('désassigne le personnage et retire l adhésion dans l exclusion', async () => {
    const state = await campaignAndAssignedCharacter();
    const result = await exclude.execute({
      campaignId: state.campaign.id.value,
      displayName: 'Frodon',
      expectedRevision: state.campaign.revision,
      actorId: anActor(ownerId),
      idempotencyKey: randomUUID(),
    });

    expect((await characters.findById(state.character.id))?.assignedTo).toBeNull();
    expect(result.target?.membership).toBe('left');
  });

  it('ne conserve pas la promotion si la désassignation échoue', async () => {
    const failing = new FailingCharacterRepository();
    characters = failing;
    const state = await campaignAndAssignedCharacter();
    const campaignPromote = lifecycleUseCase();
    promote = new PromoteCampaignMemberWithCharacterUseCase(campaignPromote, failing);

    await expect(promote.execute({
      campaignId: state.campaign.id.value,
      displayName: 'Frodon',
      expectedRevision: state.campaign.revision,
      actorId: anActor(ownerId),
      idempotencyKey: randomUUID(),
    })).rejects.toThrow('simulated character failure');

    const savedCampaign = await campaigns.findById(state.campaign.id);
    const savedCharacter = await characters.findById(state.character.id);
    expect(savedCampaign?.roleOf(UserId.create(playerId))).toBe('player');
    expect(savedCharacter?.assignedTo?.value).toBe(playerId);
  });

  it('ne conserve pas l exclusion si la désassignation échoue', async () => {
    const failing = new FailingCharacterRepository();
    characters = failing;
    const state = await campaignAndAssignedCharacter();
    exclude = new ExcludeCampaignMemberWithCharacterUseCase(
      exclusionUseCase(),
      failing,
    );

    await expect(exclude.execute({
      campaignId: state.campaign.id.value,
      displayName: 'Frodon',
      expectedRevision: state.campaign.revision,
      actorId: anActor(ownerId),
      idempotencyKey: randomUUID(),
    })).rejects.toThrow('simulated character failure');

    const savedCampaign = await campaigns.findById(state.campaign.id);
    const savedCharacter = await characters.findById(state.character.id);
    expect(savedCampaign?.roleOf(UserId.create(playerId))).toBe('player');
    expect(savedCharacter?.assignedTo?.value).toBe(playerId);
  });

  async function campaignAndAssignedCharacter() {
    const campaign = withPlayer(aCampaign(ownerId), ownerId, playerId);
    const character = assignedCharacter(campaign.id.value);
    await campaigns.save(campaign);
    await characters.save(character);
    return { campaign, character };
  }

  function lifecycleUseCase(): PromoteCampaignMemberUseCase {
    const directory = new InMemoryCampaignDirectory();
    directory.save({ id: ownerId, displayName: 'Gandalf' });
    directory.save({ id: playerId, displayName: 'Frodon' });
    return new PromoteCampaignMemberUseCase(
      campaigns,
      new InMemoryCampaignLifecycleRepository(campaigns),
      directory,
      new FixedClock(),
    );
  }

  function exclusionUseCase(): ExcludeCampaignMemberUseCase {
    const directory = new InMemoryCampaignDirectory();
    directory.save({ id: ownerId, displayName: 'Gandalf' });
    directory.save({ id: playerId, displayName: 'Frodon' });
    return new ExcludeCampaignMemberUseCase(
      campaigns,
      new InMemoryCampaignLifecycleRepository(campaigns),
      directory,
      new FixedClock(),
    );
  }

  function assignedCharacter(campaignId: string): Character {
    const character = Character.create({
      campaignId: OwningCampaignId.create(campaignId),
      name: CharacterName.create('Frodon Sacquet'),
      createdBy: UserId.create(ownerId),
      build: A_CHARACTER_BUILD,
      roll: STANDARD_ARRAY_ROLL,
      now: TEST_INSTANT,
    });
    character.assignTo(true, UserId.create(playerId), TEST_INSTANT);
    return character;
  }
});

class FailingCharacterRepository extends InMemoryCharacterRepository {
  override async saveInTransaction(
    _character: Character,
    _transactionHandle: unknown,
  ): Promise<void> {
    throw new Error('simulated character failure');
  }
}
