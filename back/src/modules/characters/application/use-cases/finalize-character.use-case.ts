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
import { loadCampaignCharacter, resolveAccessContext } from '../character.lookup';
import { toCharacterDtoResolved } from '../character.mapper';
import { AbilityRoll } from '../../domain/ability-roll';
import type { Character, CharacterAccessContext } from '../../domain/character';
import { CharacterName } from '../../domain/character-name';
import { toBuildInput } from '../character-build.mapper';

export type FinalizeCharacterDto = FinalizeCharacterBody & {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
};

/**
 * Le wizard rend sa copie. L'agrégat vérifie que les bonus appartiennent à
 * l'historique et que les choix couvrent ce que l'espèce et la classe
 * demandaient, puis le personnage porte son nouveau build.
 *
 * Le même use-case sert à l'édition d'un personnage déjà créé : montée de
 * niveau ou correction, rejouer les choix repasse par les mêmes vérifications.
 * Le tirage, s'il y en a un, vient du client comme à la création.
 */
@Injectable()
export class FinalizeCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    @Inject(ITEM_CATALOG) private readonly itemCatalog: ItemCatalogPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: FinalizeCharacterDto): Promise<CharacterDto> {
    const character = await loadCampaignCharacter(
      this.characterRepo, dto.campaignId, dto.characterId,
    );
    const context = await resolveAccessContext(
      this.membership,
      dto.campaignId,
      dto.actorId,
      character.createdBy,
    );

    this.applyWizardOutput(character, dto, context);
    await assertEquipmentIsKnown(
      this.itemCatalog,
      character.build.equipment.snapshot(),
      dto.campaignId,
    );

    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }

  /**
   * Les trois mutations que porte la copie du wizard, dans l'ordre ou l'agregat
   * les attend : le nom, le tirage s'il y en a un, puis le build. Un seul
   * instant les date toutes les trois.
   */
  private applyWizardOutput(
    character: Character,
    dto: FinalizeCharacterDto,
    context: CharacterAccessContext,
  ): void {
    const now = this.clock.now();
    character.rename(CharacterName.create(dto.name), context, now);
    if (dto.abilityRoll) character.rollAbilities(AbilityRoll.restore(dto.abilityRoll), context, now);
    character.finalize(toBuildInput(dto), context, now);
  }
}
