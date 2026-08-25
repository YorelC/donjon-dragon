import type { CampaignCommandResult } from '@donjon-dragon/shared/campaign-schema';
import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignLifecycleReceipt,
  CampaignLifecycleRepositoryPort,
} from './ports/campaign-lifecycle.repository.port';
import { CampaignCommandConflictError } from '../domain/campaign.errors';

interface ReplayRequest {
  principalId: UserId;
  idempotencyKey: string;
  intentHash: string;
}

export async function replayCampaignLifecycle(
  repository: CampaignLifecycleRepositoryPort,
  request: ReplayRequest,
): Promise<CampaignCommandResult | null> {
  const receipt = await repository.findReceipt(
    request.principalId,
    request.idempotencyKey,
  );
  if (!receipt) return null;
  return acceptedResult(receipt, request.intentHash);
}

export function acceptedResult(
  receipt: CampaignLifecycleReceipt,
  intentHash: string,
): CampaignCommandResult {
  if (receipt.intentHash !== intentHash) throw new CampaignCommandConflictError();
  if (!receipt.result) throw new CampaignCommandConflictError();
  return receipt.result;
}
