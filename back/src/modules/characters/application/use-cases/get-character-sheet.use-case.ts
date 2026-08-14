import { Inject, Injectable } from '@nestjs/common';
import type { ComputedCharacter } from '@donjon-dragon/shared/character-sheet-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';

import {
  CHARACTER_REPOSITORY,
  type CharacterRepositoryPort,
} from '../ports/character.repository.port';
import { loadCharacter } from '../character.lookup';
import { toCharacterSheetDto } from '../character-sheet.mapper';
import { NotActiveCampaignMemberError } from '../../domain/character.errors';
import { resolveSheet } from '../../domain/resolution/resolve-sheet';

export interface GetCharacterSheetDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

/**
 * La fiche d'un personnage existant, recalculée à chaque lecture.
 *
 * Tout membre actif de la campagne peut la lire : une fiche se montre à la
 * table. C'est l'édition qui est restreinte, pas la consultation.
 */
@Injectable()
export class GetCharacterSheetUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
  ) {}

  async execute(dto: GetCharacterSheetDto): Promise<ComputedCharacter> {
    const role = await this.membership.execute({
      campaignId: dto.campaignId,
      userId: dto.actorId,
    });
    if (!role.isActiveMember) throw new NotActiveCampaignMemberError();

    const character = await loadCharacter(this.characterRepo, dto.characterId);
    character.assertIsReady();

    return toCharacterSheetDto(resolveSheet(requireBuild(character.build)));
  }
}

/** `assertIsReady` vient de passer : un personnage terminé porte toujours son build. */
function requireBuild<T>(build: T | null): T {
  if (!build) throw new Error('Un personnage terminé doit porter son build');
  return build;
}
