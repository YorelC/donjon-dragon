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
import { loadCharacter, resolveAccessContext } from '../character.lookup';
import { toCharacterDtoResolved } from '../character.mapper';
import { CharacterName } from '../../domain/character-name';
import { toBuildDraft } from '../character-build.mapper';

export type FinalizeCharacterDto = FinalizeCharacterBody & {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
};

/**
 * Le wizard rend sa copie. L'agrégat vérifie tout — que la répartition sort bien
 * du tirage persisté, que les bonus appartiennent à l'historique, que les choix
 * couvrent ce que l'espèce et la classe demandaient — puis le personnage devient
 * jouable.
 *
 * Le même use-case sert à l'édition : rejouer les choix d'un personnage terminé
 * repasse par les mêmes vérifications.
 */
@Injectable()
export class FinalizeCharacterUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: FinalizeCharacterDto): Promise<CharacterDto> {
    const character = await loadCharacter(this.characterRepo, dto.characterId);
    const context = await resolveAccessContext(
      this.membership,
      dto.campaignId,
      dto.actorId,
      character.createdBy,
    );

    const now = this.clock.now();
    character.rename(CharacterName.create(dto.name), context, now);
    character.finalize(toBuildDraft(dto), context, now);

    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }
}
