import type { ZodType } from 'zod';
import type { ActorId } from '@kernel/domain/actor-id';

import type {
  JournalCommand,
  JournalCommandReceipt,
} from './ports/journal-command.repository.port';
import { JournalCommandConflictError } from '../domain/journal-chapter.errors';

/** Ce que toute commande du journal reçoit du controller, en plus de son corps. */
export interface JournalCommandRequest {
  campaignId: string;
  characterId: string;
  actorId: ActorId;
  idempotencyKey: string;
}

export type JournalCommandFacts = Omit<
  JournalCommand,
  'campaignId' | 'idempotencyKey' | 'effectiveRole'
> & { actorIsGameMaster: boolean };

export function journalCommandOf(
  request: JournalCommandRequest,
  facts: JournalCommandFacts,
): JournalCommand {
  const { actorIsGameMaster, ...command } = facts;
  return {
    ...command,
    campaignId: request.campaignId,
    idempotencyKey: request.idempotencyKey,
    effectiveRole: actorIsGameMaster ? 'gameMaster' : 'player',
  };
}

/**
 * Une clé rejouée rend le résultat déjà servi, à condition de porter la même
 * intention : réutilisée pour une autre commande, elle est refusée.
 */
export function acceptedJournalResult<T>(
  receipt: JournalCommandReceipt,
  intentHash: string,
  schema: ZodType<T>,
): T {
  if (receipt.intentHash !== intentHash) throw new JournalCommandConflictError();
  const parsed = schema.safeParse(receipt.result);
  if (!parsed.success) throw new JournalCommandConflictError();
  return parsed.data;
}
