import { Inject, Injectable } from '@nestjs/common';
import type {
  PreviewCharacterSheetDto as PreviewBody,
} from '@donjon-dragon/shared/character-schema';
import type { ComputedCharacter } from '@donjon-dragon/shared/character-sheet-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';

import { ITEM_CATALOG, type ItemCatalogPort } from '../ports/item-catalog.port';
import { assertEquipmentIsKnown } from '../item.lookup';
import { toBuildInput } from '../character-build.mapper';
import { resolveEquipment } from '../character-equipment.mapper';
import { toCharacterSheetDto } from '../character-sheet.mapper';
import { AbilityAssignment } from '../../domain/ability-assignment';
import { CharacterChoices } from '../../domain/character-choices';
import { CharacterEquipment } from '../../domain/character-equipment';
import { InvalidCharacterIdentityError } from '../../domain/character-identity';
import { NotActiveCampaignMemberError } from '../../domain/character.errors';
import { LEVEL_ONE, type CharacterBuild } from '../../domain/resolution/character-build';
import { resolveSheet } from '../../domain/resolution/resolve-sheet';
import { resolveStartingEquipment } from '../../domain/resolution/resolve-starting-equipment';
import { validateChoices } from '../../domain/resolution/validate-choices';

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
  constructor(
    @Inject(ITEM_CATALOG) private readonly itemCatalog: ItemCatalogPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(dto: PreviewCharacterSheetDto): Promise<ComputedCharacter> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();

    const build = buildFrom(dto);
    await assertEquipmentIsKnown(
      this.itemCatalog,
      build.equipment.snapshot(),
      dto.campaignId,
    );
    const equipment = await resolveEquipment(this.itemCatalog, build.equipment, dto.campaignId);

    return toCharacterSheetDto(resolveSheet(build, equipment.worn), equipment.resolved);
  }
}

function buildFrom(dto: PreviewCharacterSheetDto): CharacterBuild {
  const input = toBuildInput(dto);
  const choices = CharacterChoices.create(input.choices);
  validateChoices({ ...input, choices });

  return {
    speciesKey: input.speciesKey,
    lineageKey: input.lineageKey,
    size: required(input.size),
    standardLanguages: required(input.standardLanguages),
    classKey: input.classKey,
    backgroundKey: input.backgroundKey,
    level: LEVEL_ONE,
    abilities: abilitiesOf(input),
    choices,
    equipment: equipmentOf(input),
  };
}

type BuildInput = ReturnType<typeof toBuildInput>;

function abilitiesOf(input: BuildInput): AbilityAssignment {
  return AbilityAssignment.restore({
    base: input.base,
    backgroundBonuses: input.backgroundBonuses,
    method: input.abilityMethod,
  });
}

/** L'apercu part des memes options de depart que la creation, sans rien persister. */
function equipmentOf(input: BuildInput): CharacterEquipment {
  return CharacterEquipment.create(
    resolveStartingEquipment(input.classKey, input.backgroundKey, input.equipment),
  );
}

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new InvalidCharacterIdentityError();
  return value;
}
