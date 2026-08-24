import type { UserId } from '@kernel/domain/user-id';

import type {
  CampaignInvitationMutationReceipt,
  CampaignInvitationRepositoryPort,
} from './ports/campaign-invitation.repository.port';
import { CampaignCommandConflictError } from '../domain/campaign.errors';

export async function wasInvitationReplayed(
  repository: CampaignInvitationRepositoryPort,
  command: { principalId: UserId; idempotencyKey: string; intentHash: string },
): Promise<boolean> {
  const receipt = await repository.findReceipt(
    command.principalId,
    command.idempotencyKey,
  );
  if (!receipt) return false;
  assertSameInvitationIntent(receipt, command.intentHash);
  return true;
}

export function assertSameInvitationIntent(
  receipt: CampaignInvitationMutationReceipt,
  intentHash: string,
): void {
  if (receipt.intentHash !== intentHash) throw new CampaignCommandConflictError();
}
