import { Inject, Injectable } from '@nestjs/common';
import type {
  Character as CharacterDto,
  FinalizeCharacterDto as FinalizeCharacterBody,
} from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CHARACTER_DIRECTORY,
  type CharacterDirectoryPort,
} from '../ports/character-directory.port';
import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { ITEM_CATALOG, type ItemCatalogPort } from '../ports/item-catalog.port';
import { assertEquipmentIsKnown } from '../item.lookup';
import { toCharacterDtoResolved } from '../character.mapper';
import { toBuildInput } from '../character-build.mapper';
import { AbilityRoll } from '../../domain/ability-roll';
import { Character, type CharacterCreationInput } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import {
  NotActiveCampaignMemberError,
  PlayerAlreadyHasCharacterError,
} from '../../domain/character.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';

export type CreateCharacterDto = FinalizeCharacterBody & {
  campaignId: string;
  actorId: ActorId;
};

/**
 * Le wizard rend sa copie complète : le personnage naît déjà fini, en un seul
 * geste, jamais à moitié construit en base. Le tirage de caractéristiques
 * vient du client et n'est plus vérifié ici — voir le commentaire de classe
 * de `Character`.
 */
@Injectable()
export class CreateCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    @Inject(ITEM_CATALOG) private readonly itemCatalog: ItemCatalogPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: CreateCharacterDto): Promise<CharacterDto> {
    const campaignId = OwningCampaignId.create(dto.campaignId);
    const actorId = UserId.create(dto.actorId);
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();
    if (!role.isGameMaster) await this.assertNoExistingCharacter(campaignId, actorId);
    const now = this.clock.now();
    const character = Character.create(this.creationInputFor(dto, campaignId, actorId, now));
    await assertEquipmentIsKnown(
      this.itemCatalog,
      character.build.equipment.snapshot(),
      dto.campaignId,
    );
    if (!role.isGameMaster) character.selfAssignToCreator(now);

    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, actorId);
  }

  private creationInputFor(
    dto: CreateCharacterDto,
    campaignId: OwningCampaignId,
    createdBy: UserId,
    now: Date,
  ): CharacterCreationInput {
    return {
      campaignId,
      name: CharacterName.create(dto.name),
      identity: identityOf(dto),
      createdBy,
      build: toBuildInput(dto),
      roll: dto.abilityRoll ? AbilityRoll.restore(dto.abilityRoll) : null,
      now,
    };
  }

  private async assertNoExistingCharacter(
    campaignId: OwningCampaignId,
    playerId: UserId,
  ): Promise<void> {
    const existing = await this.characterRepo.findAssignedTo(campaignId, playerId);
    if (existing) throw new PlayerAlreadyHasCharacterError();
  }
}

/** L'etat civil du personnage, distinct de son build : rien ici n'est une regle. */
function identityOf(dto: CreateCharacterDto): CharacterCreationInput['identity'] {
  return {
    alignment: dto.alignment,
    age: dto.age,
    heightCm: dto.heightCm,
    weightKg: dto.weightKg,
    description: dto.description,
  };
}
