import { Injectable } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignInvitationAcceptanceCommand,
  CampaignInvitationCommand,
  CampaignInvitationMutationReceipt,
  CampaignInvitationRepositoryPort,
} from '../../application/ports/campaign-invitation.repository.port';
import type { CampaignId } from '../../domain/campaign-id';
import type { CampaignInvitation } from '../../domain/campaign-invitation';
import { AlreadyOpenCampaignInvitationError } from '../../domain/campaign.errors';
import { MongoCampaignInvitationEnvelopeRepository } from './mongo-campaign-invitation-envelope.repository';
import { MongoCampaignInvitationPersistenceRepository } from './mongo-campaign-invitation-persistence.repository';
import { MongoCampaignPersistenceRepository } from './mongo-campaign-persistence.repository';

const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class MongoCampaignInvitationRepository
  implements CampaignInvitationRepositoryPort
{
  constructor(
    private readonly invitations: MongoCampaignInvitationPersistenceRepository,
    private readonly campaigns: MongoCampaignPersistenceRepository,
    private readonly envelopes: MongoCampaignInvitationEnvelopeRepository,
  ) {}

  create(command: CampaignInvitationCommand): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, async (session) => {
      await this.envelopes.writeCreation(command, session);
      await this.invitations.insert(command.invitation, session);
    });
  }

  accept(
    command: CampaignInvitationAcceptanceCommand,
  ): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, async (session) => {
      await this.envelopes.writeAcceptance(command, session);
      await this.invitations.update(command.invitation, session);
      await this.campaigns.save(command.campaign, session);
    });
  }

  refuse(command: CampaignInvitationCommand): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, async (session) => {
      await this.envelopes.writeRefusal(command, session);
      await this.invitations.update(command.invitation, session);
    });
  }

  cancel(command: CampaignInvitationCommand): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, async (session) => {
      await this.envelopes.writeCancellation(command, session);
      await this.invitations.update(command.invitation, session);
    });
  }

  findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CampaignInvitationMutationReceipt | null> {
    return this.envelopes.findReceipt(principalId.value, idempotencyKey);
  }

  findOpen(
    campaignId: CampaignId,
    targetUserId: UserId,
  ): Promise<CampaignInvitation | null> {
    return this.invitations.findOpen(campaignId, targetUserId);
  }

  listOpenForTarget(targetUserId: UserId): Promise<CampaignInvitation[]> {
    return this.invitations.listOpenForTarget(targetUserId);
  }

  listOpenForCampaign(campaignId: CampaignId): Promise<CampaignInvitation[]> {
    return this.invitations.listOpenForCampaign(campaignId);
  }

  countOpenForTarget(targetUserId: UserId): Promise<number> {
    return this.invitations.countOpenForTarget(targetUserId);
  }

  private async execute(
    command: CampaignInvitationCommand,
    work: (session: ClientSession) => Promise<void>,
  ): Promise<CampaignInvitationMutationReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    try {
      await this.campaigns.transaction(work);
      return { intentHash: command.intentHash };
    } catch (error) {
      return this.recover(command, error);
    }
  }

  private async recover(
    command: CampaignInvitationCommand,
    error: unknown,
  ): Promise<CampaignInvitationMutationReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (receipt) return receipt;
    throw new AlreadyOpenCampaignInvitationError();
  }
}

function isDuplicateKey(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
