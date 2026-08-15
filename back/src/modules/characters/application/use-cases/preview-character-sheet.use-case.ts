import { Injectable } from '@nestjs/common';
import type {
  PreviewCharacterSheetDto as PreviewBody,
} from '@donjon-dragon/shared/character-schema';
import type { ComputedCharacter } from '@donjon-dragon/shared/character-sheet-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';

import { toBuildInput } from '../character-build.mapper';
import { toCharacterSheetDto } from '../character-sheet.mapper';
import { AbilityAssignment } from '../../domain/ability-assignment';
import { CharacterChoices } from '../../domain/character-choices';
import { CharacterEquipment } from '../../domain/character-equipment';
import { NotActiveCampaignMemberError } from '../../domain/character.errors';
import { LEVEL_ONE, type CharacterBuild } from '../../domain/resolution/character-build';
import { resolveSheet } from '../../domain/resolution/resolve-sheet';

export type PreviewCharacterSheetDto = PreviewBody & {
  campaignId: string;
  actorId: ActorId;
};

/**
 * L'aperçu du wizard : la fiche qu'on obtiendrait avec ces choix, sans rien
 * persister.
 *
 * C'est ce qui rend le wizard réactif sans dupliquer les règles côté front. Le
 * tirage n'est pas vérifié ici — il n'y a rien à protéger tant que rien n'est
 * enregistré, et l'aperçu doit répondre même à mi-parcours.
 */
@Injectable()
export class PreviewCharacterSheetUseCase {
  constructor(private readonly membership: GetCampaignMembershipUseCase) {}

  async execute(dto: PreviewCharacterSheetDto): Promise<ComputedCharacter> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();

    return toCharacterSheetDto(resolveSheet(buildFrom(dto)));
  }
}

function buildFrom(dto: PreviewCharacterSheetDto): CharacterBuild {
  const input = toBuildInput(dto);

  return {
    speciesKey: input.speciesKey,
    lineageKey: input.lineageKey,
    classKey: input.classKey,
    backgroundKey: input.backgroundKey,
    level: LEVEL_ONE,
    abilities: AbilityAssignment.restore({
      base: input.base,
      backgroundBonuses: input.backgroundBonuses,
      method: input.abilityMethod,
    }),
    choices: CharacterChoices.create(input.choices),
    equipment: CharacterEquipment.create(input.equipment),
  };
}
