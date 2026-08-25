import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';

import type { CampaignMutationParticipant } from '../campaign-lifecycle-participant';
import { CampaignId } from '../../domain/campaign-id';
import {
  CampaignCommandConflictError,
  CampaignRevisionConflictError,
  CannotDemoteLastGameMasterError,
  NotCampaignOwnerError,
} from '../../domain/campaign.errors';
import { InMemoryCampaignDirectory } from '../../testing/in-memory-campaign-directory';
import { InMemoryCampaignLifecycleRepository } from '../../testing/in-memory-campaign-lifecycle.repository';
import { InMemoryCampaignRepository } from '../../testing/in-memory-campaign.repository';
import { aCampaign, withPlayer } from '../../testing/campaign.fixture';
import { DemoteCampaignMemberUseCase } from './demote-campaign-member.use-case';
import { PromoteCampaignMemberUseCase } from './promote-campaign-member.use-case';

const FRODO = 'Frodon';
const noParticipant: CampaignMutationParticipant = async () => [];

describe('cycle des rôles de campagne', () => {
  let promote: PromoteCampaignMemberUseCase;
  let demote: DemoteCampaignMemberUseCase;
  let campaigns: InMemoryCampaignRepository;
  let directory: InMemoryCampaignDirectory;
  let ownerId: string;
  let playerId: string;
  let campaignId: string;

  beforeEach(() => {
    campaigns = new InMemoryCampaignRepository();
    directory = new InMemoryCampaignDirectory();
    const lifecycle = new InMemoryCampaignLifecycleRepository(campaigns);
    const clock = new FixedClock();
    promote = new PromoteCampaignMemberUseCase(campaigns, lifecycle, directory, clock);
    demote = new DemoteCampaignMemberUseCase(campaigns, lifecycle, directory, clock);
    ownerId = randomUUID();
    playerId = randomUUID();
    directory.save({ id: ownerId, displayName: 'Gandalf' });
    directory.save({ id: playerId, displayName: FRODO });
  });

  it('promeut un joueur et rend le résultat autoritaire', async () => {
    const campaign = await campaignWithPlayer();
    const result = await promote.execute(command(campaign.revision), noParticipant);
    const saved = await reload(campaign.id.value);

    expect(saved?.roleOf(UserId.create(playerId))).toBe('gameMaster');
    expect(result).toMatchObject({
      revision: campaign.revision + 1,
      target: { displayName: FRODO, role: 'gameMaster', membership: 'active' },
    });
  });

  it('rejoue sans nouvel effet puis refuse une autre intention sous la même clé', async () => {
    const campaign = await campaignWithPlayer();
    const dto = command(campaign.revision);
    const first = await promote.execute(dto, noParticipant);
    const replay = await promote.execute(dto, noParticipant);

    expect(replay).toEqual(first);
    await expect(demote.execute({ ...dto, expectedRevision: first.revision }))
      .rejects.toThrow(CampaignCommandConflictError);
    expect((await reload(campaign.id.value))?.revision).toBe(first.revision);
  });

  it('refuse une révision périmée', async () => {
    const campaign = await campaignWithPlayer();
    await expect(promote.execute(command(campaign.revision - 1), noParticipant))
      .rejects.toThrow(CampaignRevisionConflictError);
  });

  it('rétrograde un co-MJ sans retirer son adhésion', async () => {
    const campaign = await campaignWithPlayer();
    campaign.promote(UserId.create(ownerId), UserId.create(playerId), new Date());
    await campaigns.save(campaign);

    const result = await demote.execute(command(campaign.revision));

    expect(result.target).toMatchObject({ role: 'player', membership: 'active' });
    expect((await reload(campaign.id.value))?.players()).toHaveLength(1);
  });

  it('refuse de rétrograder le dernier MJ, propriétaire inclus', async () => {
    const campaign = aCampaign(ownerId);
    campaignId = campaign.id.value;
    await campaigns.save(campaign);
    await expect(demote.execute({
      ...command(campaign.revision),
      displayName: 'Gandalf',
    })).rejects.toThrow(CannotDemoteLastGameMasterError);
  });

  it('contrôle le propriétaire avant toute résolution de pseudo', async () => {
    const campaign = await campaignWithPlayer();
    await expect(promote.execute({
      ...command(campaign.revision),
      displayName: 'Inconnu',
      actorId: anActor(playerId),
    }, noParticipant)).rejects.toThrow(NotCampaignOwnerError);
    expect(directory.displayNameLookups).toBe(0);
  });

  async function campaignWithPlayer() {
    const campaign = withPlayer(aCampaign(ownerId), ownerId, playerId);
    campaignId = campaign.id.value;
    await campaigns.save(campaign);
    return campaign;
  }

  function command(expectedRevision: number) {
    return {
      campaignId,
      displayName: FRODO,
      expectedRevision,
      actorId: anActor(ownerId),
      idempotencyKey: stableKey,
    };
  }

  async function reload(id: string) {
    return campaigns.findById(CampaignId.create(id));
  }
});

const stableKey = randomUUID();
