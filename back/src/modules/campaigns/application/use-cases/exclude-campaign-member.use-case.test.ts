import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserId } from '@kernel/domain/user-id';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';

import { CampaignId } from '../../domain/campaign-id';
import {
  CampaignCommandConflictError,
  CampaignRevisionConflictError,
  NotCampaignOwnerError,
} from '../../domain/campaign.errors';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignLifecycleRepository } from '../../testing/in-memory-campaign-lifecycle.repository';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { ExcludeCampaignMemberUseCase } from './exclude-campaign-member.use-case';

const TARGET_NAME = 'Frodon';

describe('ExcludeCampaignMemberUseCase', () => {
  let campaigns: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let exclude: ExcludeCampaignMemberUseCase;
  let ownerId: string;
  let targetId: string;
  let storedCampaignId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    exclude = new ExcludeCampaignMemberUseCase(
      campaigns,
      new InMemoryCampaignLifecycleRepository(campaigns),
      directory,
      new FixedClock(),
    );
    ownerId = randomUUID();
    targetId = randomUUID();
    directory.save({ id: ownerId, displayName: 'Gandalf' });
    directory.save({ id: targetId, displayName: TARGET_NAME });
  });

  it('exclut un joueur et rend son état autoritaire', async () => {
    const campaign = await campaignWithTarget();

    const result = await exclude.execute(command(campaign.revision), noParticipant);

    expect(result.target).toEqual({
      displayName: TARGET_NAME,
      membership: 'left',
      role: null,
      isOwner: false,
    });
    expect((await reload(campaign.id.value))?.members).toHaveLength(1);
  });

  it('exclut directement un co-MJ', async () => {
    const campaign = await campaignWithTarget();
    campaign.promote(UserId.create(ownerId), UserId.create(targetId), new Date());
    await campaigns.save(campaign);

    await exclude.execute(command(campaign.revision), noParticipant);

    expect((await reload(campaign.id.value))?.members).toHaveLength(1);
  });

  it('rejoue sans annuaire puis refuse une intention divergente', async () => {
    const campaign = await campaignWithTarget();
    const dto = command(campaign.revision);
    const first = await exclude.execute(dto, noParticipant);

    expect(await exclude.execute(dto, noParticipant)).toEqual(first);
    await expect(exclude.execute({ ...dto, displayName: 'Sam' }, noParticipant))
      .rejects.toThrow(CampaignCommandConflictError);
    expect(directory.displayNameLookups).toBe(1);
  });

  it('refuse une révision périmée', async () => {
    const campaign = await campaignWithTarget();

    await expect(exclude.execute(command(campaign.revision - 1), noParticipant))
      .rejects.toThrow(CampaignRevisionConflictError);
  });

  it('contrôle le propriétaire avant de résoudre la cible', async () => {
    const campaign = await campaignWithTarget();

    await expect(exclude.execute({
      ...command(campaign.revision),
      actorId: anActor(targetId),
      displayName: 'Inconnu',
    }, noParticipant)).rejects.toThrow(NotCampaignOwnerError);
    expect(directory.displayNameLookups).toBe(0);
  });

  async function campaignWithTarget() {
    const campaign = withPlayer(aCampaign(ownerId), ownerId, targetId);
    storedCampaignId = campaign.id.value;
    await campaigns.save(campaign);
    return campaign;
  }

  function command(expectedRevision: number) {
    return {
      campaignId: storedCampaignId,
      displayName: TARGET_NAME,
      expectedRevision,
      actorId: anActor(ownerId),
      idempotencyKey: stableKey,
    };
  }

  function reload(id: string) {
    return campaigns.findById(CampaignId.create(id));
  }
});

const stableKey = randomUUID();
const noParticipant = async () => [];
