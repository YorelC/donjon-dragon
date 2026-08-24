import { UserId } from '@kernel/domain/user-id';

import type {
  CampaignInvitationAcceptanceCommand,
  CampaignInvitationCommand,
  CampaignInvitationMutationReceipt,
  CampaignInvitationRepositoryPort,
} from '../application/ports/campaign-invitation.repository.port';
import type { CampaignId } from '../domain/campaign-id';
import {
  CampaignInvitation,
  type CampaignInvitationSnapshot,
} from '../domain/campaign-invitation';
import { CAMPAIGN_INVITATION_STATUS } from '../domain/campaign-invitation-status';
import {
  AlreadyOpenCampaignInvitationError,
  CampaignInvitationRevisionConflictError,
} from '../domain/campaign.errors';
import type { InMemoryCampaignRepository } from './in-memory-campaign.repository';

export class InMemoryCampaignInvitationRepository
  implements CampaignInvitationRepositoryPort
{
  private readonly invitations = new Map<string, CampaignInvitationSnapshot>();
  private readonly receipts = new Map<string, CampaignInvitationMutationReceipt>();

  constructor(private readonly campaigns?: InMemoryCampaignRepository) {}

  async create(
    command: CampaignInvitationCommand,
  ): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, () => this.insert(command.invitation));
  }

  async accept(
    command: CampaignInvitationAcceptanceCommand,
  ): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, async () => {
      this.update(command.invitation);
      await this.campaigns?.save(command.campaign);
    });
  }

  async refuse(
    command: CampaignInvitationCommand,
  ): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, () => this.update(command.invitation));
  }

  async cancel(
    command: CampaignInvitationCommand,
  ): Promise<CampaignInvitationMutationReceipt> {
    return this.execute(command, () => this.update(command.invitation));
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CampaignInvitationMutationReceipt | null> {
    return this.receipts.get(receiptKey(principalId, idempotencyKey)) ?? null;
  }

  async findOpen(
    campaignId: CampaignId,
    targetUserId: UserId,
  ): Promise<CampaignInvitation | null> {
    const snapshot = this.all().find(
      (item) =>
        item.campaignId === campaignId.value &&
        item.targetUserId === targetUserId.value &&
        item.status === CAMPAIGN_INVITATION_STATUS.pending,
    );
    return snapshot ? CampaignInvitation.restore(snapshot) : null;
  }

  async listOpenForTarget(targetUserId: UserId): Promise<CampaignInvitation[]> {
    return this.open().filter((item) => item.targetUserId.equals(targetUserId));
  }

  async listOpenForCampaign(campaignId: CampaignId): Promise<CampaignInvitation[]> {
    return this.open().filter((item) => item.campaignId.equals(campaignId));
  }

  async countOpenForTarget(targetUserId: UserId): Promise<number> {
    return (await this.listOpenForTarget(targetUserId)).length;
  }

  snapshots(): CampaignInvitationSnapshot[] {
    return this.all();
  }

  private async execute(
    command: CampaignInvitationCommand,
    work: () => void | Promise<void>,
  ): Promise<CampaignInvitationMutationReceipt> {
    const key = receiptKey(command.principalId, command.idempotencyKey);
    const existing = this.receipts.get(key);
    if (existing) return existing;
    await work();
    const receipt = { intentHash: command.intentHash };
    this.receipts.set(key, receipt);
    return receipt;
  }

  private insert(invitation: CampaignInvitation): void {
    const snapshot = invitation.snapshot();
    if (this.hasOpen(snapshot)) throw new AlreadyOpenCampaignInvitationError();
    this.invitations.set(snapshot.id, snapshot);
  }

  private update(invitation: CampaignInvitation): void {
    const snapshot = invitation.snapshot();
    const persisted = this.invitations.get(snapshot.id);
    if (!isExpectedRevision(persisted, snapshot)) {
      throw new CampaignInvitationRevisionConflictError();
    }
    this.invitations.set(snapshot.id, snapshot);
  }

  private hasOpen(candidate: CampaignInvitationSnapshot): boolean {
    return this.all().some(
      (item) =>
        item.campaignId === candidate.campaignId &&
        item.targetUserId === candidate.targetUserId &&
        item.status === CAMPAIGN_INVITATION_STATUS.pending,
    );
  }

  private open(): CampaignInvitation[] {
    return this.all()
      .filter((item) => item.status === CAMPAIGN_INVITATION_STATUS.pending)
      .map((item) => CampaignInvitation.restore(item));
  }

  private all(): CampaignInvitationSnapshot[] {
    return [...this.invitations.values()];
  }
}

function receiptKey(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}

function isExpectedRevision(
  persisted: CampaignInvitationSnapshot | undefined,
  candidate: CampaignInvitationSnapshot,
): boolean {
  return (
    persisted?.status === CAMPAIGN_INVITATION_STATUS.pending &&
    persisted.revision === candidate.revision - 1
  );
}
