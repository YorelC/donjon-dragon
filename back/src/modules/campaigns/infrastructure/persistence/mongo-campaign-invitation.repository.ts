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
    // La transaction ecrit l'invitation, le recu, l'audit et l'outbox : chacun a
    // ses propres index uniques. Seule une collision sur l'index d'invitation
    // ouverte signifie « invitation deja ouverte ». Toute autre remonte telle
    // quelle, sous peine d'envoyer le diagnostic dans la mauvaise direction.
    if (!violates(error, OPEN_INVITATION_INDEX)) throw error;
    throw new AlreadyOpenCampaignInvitationError();
  }
}

function isDuplicateKey(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}

/** L'index unique de `campaign-invitation.schema.ts`, partiel sur `status: pending`. */
const OPEN_INVITATION_INDEX = ['campaignId', 'targetUserId'];

function violates(error: unknown, keys: readonly string[]): boolean {
  const pattern = keyPatternOf(error);
  return !!pattern && keys.every((key) => key in pattern);
}

function keyPatternOf(error: unknown): Record<string, unknown> | null {
  if (!error || typeof error !== 'object' || !('keyPattern' in error)) return null;
  const pattern = (error as { keyPattern: unknown }).keyPattern;
  return pattern && typeof pattern === 'object'
    ? (pattern as Record<string, unknown>)
    : null;
}
