import type { UserId } from '@kernel/domain/user-id';

import type {
  CharacterCreationCommand,
  CharacterCreationReceipt,
  CharacterCreationRepositoryPort,
} from '../application/ports/character-creation.repository.port';
import type { CharacterRepositoryPort } from '../application/ports/character.repository.port';

export class InMemoryCharacterCreationRepository
  implements CharacterCreationRepositoryPort
{
  private readonly receipts = new Map<string, CharacterCreationReceipt>();

  constructor(private readonly characters: CharacterRepositoryPort) {}

  async execute(command: CharacterCreationCommand): Promise<CharacterCreationReceipt> {
    const existing = await this.findReceipt(command.principalId, command.idempotencyKey);
    if (existing) return existing;
    await this.characters.save(command.character);
    const receipt = { intentHash: command.intentHash, result: command.result };
    this.receipts.set(keyOf(command.principalId, command.idempotencyKey), receipt);
    return receipt;
  }

  async findReceipt(
    principalId: UserId,
    idempotencyKey: string,
  ): Promise<CharacterCreationReceipt | null> {
    return this.receipts.get(keyOf(principalId, idempotencyKey)) ?? null;
  }

  /**
   * Pose un reçu tel quel, y compris illisible. Un reçu écrit par une version
   * précédente, ou par une autre commande sous la même clé, arrive au use-case
   * sous cette forme : `result` à `null`, empreinte présente.
   */
  plantReceipt(
    principalId: UserId,
    idempotencyKey: string,
    receipt: CharacterCreationReceipt,
  ): void {
    this.receipts.set(keyOf(principalId, idempotencyKey), receipt);
  }
}

function keyOf(principalId: UserId, idempotencyKey: string): string {
  return `${principalId.value}:${idempotencyKey}`;
}
