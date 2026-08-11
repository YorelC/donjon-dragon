import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import { AbilityScores, type AbilityScoresSnapshot } from './ability-scores';
import { CharacterId } from './character-id';
import { CharacterName } from './character-name';
import { CharacterTrait } from './character-trait';
import {
  AlreadyAssignedToThisPlayerError,
  NotAssignedError,
  NotEditableByActorError,
  OnlyGameMasterCanAssignError,
} from './character.errors';
import { OwningCampaignId } from './owning-campaign-id';

export interface CharacterSnapshot {
  id: string;
  campaignId: string;
  name: string;
  race: string;
  characterClass: string;
  abilityScores: AbilityScoresSnapshot;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterSheet {
  name: CharacterName;
  race: CharacterTrait;
  characterClass: CharacterTrait;
  abilityScores: AbilityScores;
}

/**
 * Ce qu'il faut savoir de l'appelant pour trancher une édition — un seul
 * paramètre objet, plutôt que quatre booléens positionnels indistinguables.
 * `creatorIsGameMaster` répond à « le créateur est-il ACTUELLEMENT un MJ ? »,
 * relu en direct côté use-case : un rôle change, la règle suit.
 */
export interface CharacterAccessContext {
  actorId: UserId;
  actorIsGameMaster: boolean;
  actorIsCampaignOwner: boolean;
  creatorIsGameMaster: boolean;
}

/**
 * Une fiche de personnage D&D classique, rattachée à une campagne. `assignedTo`
 * est `null` tant qu'elle vit dans le pool du maître du jeu ; un personnage
 * n'est jamais attribué à un autre MJ, seulement à un joueur.
 */
export class Character {
  private constructor(
    readonly id: CharacterId,
    readonly campaignId: OwningCampaignId,
    private currentSheet: CharacterSheet,
    readonly createdBy: UserId,
    private currentAssignedTo: UserId | null,
    readonly createdAt: string,
    private currentUpdatedAt: string,
  ) {}

  static create(
    campaignId: OwningCampaignId,
    sheet: CharacterSheet,
    createdBy: UserId,
    now: Date,
  ): Character {
    const createdAt = now.toISOString();
    return new Character(
      CharacterId.create(randomUUID()),
      campaignId,
      sheet,
      createdBy,
      null,
      createdAt,
      createdAt,
    );
  }

  static restore(snapshot: CharacterSnapshot): Character {
    return new Character(
      CharacterId.create(snapshot.id),
      OwningCampaignId.create(snapshot.campaignId),
      sheetFrom(snapshot),
      UserId.create(snapshot.createdBy),
      snapshot.assignedTo ? UserId.create(snapshot.assignedTo) : null,
      snapshot.createdAt,
      snapshot.updatedAt,
    );
  }

  get sheet(): CharacterSheet {
    return this.currentSheet;
  }

  get assignedTo(): UserId | null {
    return this.currentAssignedTo;
  }

  get updatedAt(): string {
    return this.currentUpdatedAt;
  }

  update(sheet: CharacterSheet, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);
    this.currentSheet = sheet;
    this.touch(now);
  }

  /**
   * Un joueur qui crée sa propre fiche se l'attribue dans le même geste : pas
   * de passage par `assignTo`, réservé à l'attribution PAR un maître du jeu.
   */
  selfAssignToCreator(now: Date): void {
    this.currentAssignedTo = this.createdBy;
    this.touch(now);
  }

  assignTo(actorIsGameMaster: boolean, playerId: UserId, now: Date): void {
    if (!actorIsGameMaster) throw new OnlyGameMasterCanAssignError();
    if (this.currentAssignedTo?.equals(playerId)) {
      throw new AlreadyAssignedToThisPlayerError();
    }

    this.currentAssignedTo = playerId;
    this.touch(now);
  }

  unassign(actorIsGameMaster: boolean, now: Date): void {
    if (!actorIsGameMaster) throw new OnlyGameMasterCanAssignError();
    if (!this.currentAssignedTo) throw new NotAssignedError();

    this.currentAssignedTo = null;
    this.touch(now);
  }

  /**
   * Un joueur ne touche qu'à son propre personnage assigné. Un MJ touche à ce
   * qu'il a créé, à ce qui est attribué à un joueur (jamais à un autre MJ), à
   * ce qu'un joueur a créé sans l'avoir en charge, ou à tout s'il est en plus
   * propriétaire de la campagne.
   */
  assertEditableBy(context: CharacterAccessContext): void {
    if (!context.actorIsGameMaster) {
      if (!this.currentAssignedTo?.equals(context.actorId)) {
        throw new NotEditableByActorError();
      }
      return;
    }

    const editable =
      this.createdBy.equals(context.actorId) ||
      this.currentAssignedTo !== null ||
      !context.creatorIsGameMaster ||
      context.actorIsCampaignOwner;

    if (!editable) throw new NotEditableByActorError();
  }

  snapshot(): CharacterSnapshot {
    return {
      id: this.id.value,
      campaignId: this.campaignId.value,
      name: this.currentSheet.name.value,
      race: this.currentSheet.race.value,
      characterClass: this.currentSheet.characterClass.value,
      abilityScores: this.currentSheet.abilityScores.snapshot(),
      createdBy: this.createdBy.value,
      assignedTo: this.currentAssignedTo?.value ?? null,
      createdAt: this.createdAt,
      updatedAt: this.currentUpdatedAt,
    };
  }

  private touch(now: Date): void {
    this.currentUpdatedAt = now.toISOString();
  }
}

function sheetFrom(snapshot: CharacterSnapshot): CharacterSheet {
  return {
    name: CharacterName.create(snapshot.name),
    race: CharacterTrait.create(snapshot.race, 'la race'),
    characterClass: CharacterTrait.create(snapshot.characterClass, 'la classe'),
    abilityScores: AbilityScores.create(snapshot.abilityScores),
  };
}
