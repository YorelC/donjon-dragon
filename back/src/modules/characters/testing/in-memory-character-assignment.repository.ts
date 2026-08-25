import type { UserId } from '@kernel/domain/user-id';

import type {
  CharacterAssignmentCommand,
  CharacterAssignmentReceipt,
  CharacterAssignmentRepositoryPort,
} from '../application/ports/character-assignment.repository.port';
import type { InMemoryCharacterRepository } from './in-memory-character.repository';

export class InMemoryCharacterAssignmentRepository
  implements CharacterAssignmentRepositoryPort
{
  private readonly receipts = new Map<string, CharacterAssignmentReceipt>();
  readonly facts: string[] = [];
  readonly audits: string[] = [];

  constructor(private readonly characters: InMemoryCharacterRepository) {}

  async execute(command: CharacterAssignmentCommand): Promise<CharacterAssignmentReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    if (command.previousCharacter) await this.characters.save(command.previousCharacter);
    await this.characters.save(command.character);
    const receipt = { intentHash: command.intentHash, result: command.result };
    this.receipts.set(receiptKey(command.principalId, command.idempotencyKey), receipt);
    this.facts.push(...command.facts);
    this.audits.push(command.facts.at(-1) ?? 'character.unassigned');
    return receipt;
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CharacterAssignmentReceipt | null> {
    return this.receipts.get(receiptKey(principalId, idempotencyKey)) ?? null;
  }
}

function receiptKey(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}
