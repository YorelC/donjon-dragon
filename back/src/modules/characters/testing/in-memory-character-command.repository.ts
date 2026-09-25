import type { UserId } from '@kernel/domain/user-id';

import type {
  CharacterCommand,
  CharacterCommandReceipt,
  CharacterCommandRepositoryPort,
} from '../application/ports/character-command.repository.port';
import type { InMemoryCharacterRepository } from './in-memory-character.repository';

export class InMemoryCharacterCommandRepository implements CharacterCommandRepositoryPort {
  private readonly receipts = new Map<string, CharacterCommandReceipt>();
  readonly actions: string[] = [];
  readonly versions: CharacterCommand['buildVersion'][] = [];

  constructor(private readonly characters: InMemoryCharacterRepository) {}

  async execute(command: CharacterCommand): Promise<CharacterCommandReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    await this.characters.save(command.character);
    const receipt = { intentHash: command.intentHash, result: command.result };
    this.receipts.set(receiptKey(command.principalId, command.idempotencyKey), receipt);
    this.actions.push(command.action);
    if (command.buildVersion) this.versions.push(command.buildVersion);
    return receipt;
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CharacterCommandReceipt | null> {
    return this.receipts.get(receiptKey(principalId, idempotencyKey)) ?? null;
  }
}

function receiptKey(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}
