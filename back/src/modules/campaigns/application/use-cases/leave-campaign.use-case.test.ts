import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import type { CampaignMutationParticipant } from '../campaign-lifecycle-participant';
import { CampaignId } from '../../domain/campaign-id';
import {
  CannotTransferToSelfError,
  NotAGameMasterError,
  SuccessorRequiredError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignLifecycleRepository } from '../../testing/in-memory-campaign-lifecycle.repository';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { LeaveCampaignUseCase } from './leave-campaign.use-case';
import { TransferCampaignOwnershipUseCase } from './transfer-campaign-ownership.use-case';

const FRODO = 'Frodon';
const noParticipant: CampaignMutationParticipant = async () => [];

describe('propriété et départ de campagne', () => {
  let leave: LeaveCampaignUseCase;
  let transfer: TransferCampaignOwnershipUseCase;
  let campaigns: InMemoryCampaignRepository;
  let ownerId: string;
  let memberId: string;
  let campaignId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    const directory = new InMemoryCampaignDirectory();
    const lifecycle = new InMemoryCampaignLifecycleRepository(campaigns);
    const clock = new FixedClock();
    leave = new LeaveCampaignUseCase(campaigns, lifecycle, directory, clock);
    transfer = new TransferCampaignOwnershipUseCase(
      campaigns,
      lifecycle,
      directory,
      clock,
    );
    ownerId = randomUUID();
    memberId = randomUUID();
    directory.save({ id: ownerId, displayName: 'Gandalf' });
    directory.save({ id: memberId, displayName: FRODO });
  });

  it('transfère uniquement vers un MJ actif sans changer son rôle', async () => {
    const campaign = await campaignWithCoMaster();
    const result = await transfer.execute(transferCommand(campaign.revision));

    expect(result.target).toMatchObject({ role: 'gameMaster', isOwner: true });
    expect(result.actor.isOwner).toBe(false);
  });

  it('refuse un transfert vers un joueur et vers soi-même', async () => {
    const campaign = await campaignWithPlayer();
    await expect(transfer.execute(transferCommand(campaign.revision)))
      .rejects.toThrow(NotAGameMasterError);
    await expect(transfer.execute({
      ...transferCommand(campaign.revision),
      displayName: 'Gandalf',
      idempotencyKey: randomUUID(),
    })).rejects.toThrow(CannotTransferToSelfError);
  });

  it('fait quitter un membre ordinaire et rejoue le résultat après son départ', async () => {
    const campaign = await campaignWithPlayer();
    const dto = leaveCommand(campaign.revision, memberId);
    const first = await leave.execute(dto, noParticipant);
    const replay = await leave.execute(dto, noParticipant);

    expect(first.actor).toEqual({ membership: 'left', role: null, isOwner: false });
    expect(replay).toEqual(first);
    expect((await reload(campaign.id.value))?.players()).toHaveLength(0);
  });

  it('refuse le départ du propriétaire sans successeur', async () => {
    const campaign = await campaignWithCoMaster();
    await expect(leave.execute(leaveCommand(campaign.revision, ownerId), noParticipant))
      .rejects.toThrow(SuccessorRequiredError);
  });

  it('transfère et retire le propriétaire dans une seule commande', async () => {
    const campaign = await campaignWithCoMaster();
    const result = await leave.execute({
      ...leaveCommand(campaign.revision, ownerId),
      successorDisplayName: FRODO,
    }, noParticipant);
    const saved = await reload(campaign.id.value);

    expect(result.actor.membership).toBe('left');
    expect(result.target).toMatchObject({ isOwner: true, role: 'gameMaster' });
    expect(saved?.ownerId.equals(UserId.create(memberId))).toBe(true);
    expect(saved?.gameMasters()).toHaveLength(1);
  });

  async function campaignWithPlayer() {
    const campaign = withPlayer(aCampaign(ownerId), ownerId, memberId);
    campaignId = campaign.id.value;
    await campaigns.save(campaign);
    return campaign;
  }

  async function campaignWithCoMaster() {
    const campaign = await campaignWithPlayer();
    campaign.promote(UserId.create(ownerId), UserId.create(memberId), new Date());
    await campaigns.save(campaign);
    return campaign;
  }

  function transferCommand(expectedRevision: number) {
    return {
      campaignId,
      displayName: FRODO,
      expectedRevision,
      actorId: anActor(ownerId),
      idempotencyKey: randomUUID(),
    };
  }

  function leaveCommand(expectedRevision: number, actorId: string) {
    return {
      campaignId,
      expectedRevision,
      actorId: anActor(actorId),
      idempotencyKey: stableLeaveKey,
    };
  }

  async function reload(id: string) {
    return campaigns.findById(CampaignId.create(id));
  }
});

const stableLeaveKey = randomUUID();
