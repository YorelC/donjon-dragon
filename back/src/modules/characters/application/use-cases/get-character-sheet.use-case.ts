import { Inject, Injectable } from '@nestjs/common';
import type { ComputedCharacter } from '@donjon-dragon/shared/character-sheet-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { ITEM_CATALOG, type ItemCatalogPort } from '../ports/item-catalog.port';
import { loadCampaignCharacter } from '../character.lookup';
import { resolveEquipment } from '../character-equipment.mapper';
import { toCharacterSheetDto } from '../character-sheet.mapper';
import { CharacterNotFoundError } from '../../domain/character.errors';
import { resolveSheet } from '../../domain/resolution/resolve-sheet';

export interface GetCharacterSheetDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

/**
 * La fiche d'un personnage existant, recalculée à chaque lecture.
 *
 * La fiche complète est privée : seuls le joueur assigné et les MJ actifs de
 * la campagne la lisent. Les autres cas restent masqués comme une absence.
 */
@Injectable()
export class GetCharacterSheetUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(ITEM_CATALOG) private readonly itemCatalog: ItemCatalogPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(dto: GetCharacterSheetDto): Promise<ComputedCharacter> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new CharacterNotFoundError();
    const character = await loadCampaignCharacter(
      this.characterRepo, dto.campaignId, dto.characterId,
    );
    const assignedToActor = character.assignedTo?.equals(UserId.create(dto.actorId));
    if (!role.isGameMaster && !assignedToActor) throw new CharacterNotFoundError();
    const equipment = await resolveEquipment(
      this.itemCatalog,
      character.build.equipment,
      dto.campaignId,
    );

    return toCharacterSheetDto(resolveSheet(character.build, equipment.worn), equipment.resolved);
  }
}
