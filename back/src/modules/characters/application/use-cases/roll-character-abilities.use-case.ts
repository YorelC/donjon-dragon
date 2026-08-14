import { Inject, Injectable } from '@nestjs/common';
import type { Character as CharacterDto } from '@donjon-dragon/shared/character-schema';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import { DICE, type Dice } from '@kernel/application/dice.port';
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
import { AbilityRoll, DICE_PER_ROLL, DIE_SIDES, ROLL_COUNT } from '../../domain/ability-roll';

export interface RollCharacterAbilitiesDto {
  characterId: string;
  campaignId: string;
  actorId: ActorId;
}

/**
 * Lance les dés, côté serveur, et les persiste sur le brouillon.
 *
 * C'est le seul endroit où le tirage existe. Un tirage fait dans le navigateur
 * n'en serait pas un : rien n'empêcherait un client de renvoyer six 18. En le
 * gardant ici, la répartition envoyée plus tard se vérifie contre un tirage
 * dont le serveur se souvient.
 */
@Injectable()
export class RollCharacterAbilitiesUseCase {
  constructor(
    @Inject(CHARACTER_REPOSITORY)
    private readonly characterRepo: CharacterRepositoryPort,
    @Inject(CHARACTER_DIRECTORY)
    private readonly directory: CharacterDirectoryPort,
    private readonly membership: GetCampaignMembershipUseCase,
    @Inject(DICE) private readonly dice: Dice,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(dto: RollCharacterAbilitiesDto): Promise<CharacterDto> {
    const character = await loadCharacter(this.characterRepo, dto.characterId);
    const context = await resolveAccessContext(
      this.membership,
      dto.campaignId,
      dto.actorId,
      character.createdBy,
    );

    character.rollAbilities(this.rollAbilities(), context, this.clock.now());
    await this.characterRepo.save(character);
    return toCharacterDtoResolved(this.directory, character, UserId.create(dto.actorId));
  }

  private rollAbilities(): AbilityRoll {
    return AbilityRoll.create(
      Array.from({ length: ROLL_COUNT }, () =>
        Array.from({ length: DICE_PER_ROLL }, () => this.dice.roll(DIE_SIDES)),
      ),
    );
  }
}
