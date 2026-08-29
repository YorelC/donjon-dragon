import { Injectable } from '@nestjs/common';
import type { ClientSession } from 'mongoose';
import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignCreationCommand,
  CampaignCreationReceipt,
  CampaignCreationResult,
  CampaignRepositoryPort,
} from '../../application/ports/campaign.repository.port';
import type { Campaign } from '../../domain/campaign';
import type { CampaignId } from '../../domain/campaign-id';
import { MEMBERSHIP_STATUS } from '../../domain/membership-status';
import { MongoCampaignEnvelopeRepository } from './mongo-campaign-envelope.repository';
import { MongoCampaignPersistenceRepository } from './mongo-campaign-persistence.repository';

const DUPLICATE_KEY_ERROR = 11000;

@Injectable()
export class MongoCampaignRepository implements CampaignRepositoryPort {
  constructor(
    private readonly campaigns: MongoCampaignPersistenceRepository,
    private readonly envelopes: MongoCampaignEnvelopeRepository,
  ) {}

  async create(command: CampaignCreationCommand): Promise<CampaignCreationReceipt> {
    const existing = await this.findReceipt(command);
    if (existing) return existing;

    try {
      return await this.campaigns.transaction((session) =>
        this.persistCreation(command, session),
      );
    } catch (error) {
      return this.recoverConcurrentReplay(command, error);
    }
  }

  save(campaign: Campaign): Promise<void> {
    return this.campaigns.transaction((session) => this.campaigns.save(campaign, session));
  }

  findById(id: CampaignId): Promise<Campaign | null> {
    return this.campaigns.findById(id);
  }

  findManyByIds(ids: CampaignId[]): Promise<Campaign[]> {
    return this.campaigns.findManyByIds(ids);
  }

  listActiveForUser(userId: UserId): Promise<Campaign[]> {
    return this.campaigns.listForUser(userId, MEMBERSHIP_STATUS.active);
  }

  deleteById(id: CampaignId): Promise<void> {
    return this.campaigns.deleteById(id);
  }

  private async persistCreation(
    command: CampaignCreationCommand,
    session: ClientSession,
  ): Promise<CampaignCreationReceipt> {
    const result = creationResult(command.campaign);
    await this.envelopes.write(command, result, session);
    await this.campaigns.save(command.campaign, session);
    return { intentHash: command.intentHash, result };
  }

  private findReceipt(
    command: CampaignCreationCommand,
  ): Promise<CampaignCreationReceipt | null> {
    return this.envelopes.findReceipt(
      command.principalId.value,
      command.idempotencyKey,
    );
  }

  private async recoverConcurrentReplay(
    command: CampaignCreationCommand,
    error: unknown,
  ): Promise<CampaignCreationReceipt> {
    if (!isDuplicateKey(error)) throw error;
    const receipt = await this.findReceipt(command);
    if (!receipt) throw error;
    return receipt;
  }
}

function creationResult(campaign: Campaign): CampaignCreationResult {
  return {
    campaignId: campaign.id.value,
    name: campaign.name.value,
    ownerUserId: campaign.ownerId.value,
    gameMasterCount: campaign.gameMasters().length,
    playerCount: campaign.players().length,
  };
}

function isDuplicateKey(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  return 'code' in error && error.code === DUPLICATE_KEY_ERROR;
}
