import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import {
  AbilityAssignment,
  type AbilityAssignmentSnapshot,
  type AbilityBonuses,
} from './ability-assignment';
import type { AbilityMethod } from './ability-generation';
import { AbilityRoll, type AbilityRollSnapshot } from './ability-roll';
import {
  CharacterChoices,
  type CharacterChoice,
  type CharacterChoicesSnapshot,
} from './character-choices';
import {
  CharacterEquipment,
  type CharacterEquipmentSnapshot,
} from './character-equipment';
import { CharacterId } from './character-id';
import { CharacterName } from './character-name';
import {
  AlreadyAssignedToThisPlayerError,
  NotAssignedError,
  NotEditableByActorError,
  OnlyGameMasterCanAssignError,
} from './character.errors';
import { OwningCampaignId } from './owning-campaign-id';
import type { AbilityRecord } from './reference/abilities';
import { BACKGROUNDS } from './reference/backgrounds';
import type { BackgroundKey, ClassKey, LineageKey, SpeciesKey } from './reference/keys';
import { LEVEL_ONE, type CharacterBuild } from './resolution/character-build';
import { validateChoices } from './resolution/validate-choices';

/**
 * Ne décrit pas l'avancement de la création — un personnage n'existe en base
 * que déjà complet — mais sa participation à l'aventure de la campagne.
 * `'waiting_adventure'` est la seule valeur possible pour l'instant ; un futur
 * statut `'in_adventure'` viendra restreindre l'édition au MJ une fois la
 * partie commencée.
 */
export type CharacterStatus = 'waiting_adventure';

export interface CharacterBuildSnapshot {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  abilities: AbilityAssignmentSnapshot;
  choices: CharacterChoicesSnapshot;
  equipment: CharacterEquipmentSnapshot;
}

export interface CharacterSnapshot {
  id: string;
  campaignId: string;
  name: string;
  status: CharacterStatus;
  abilityRoll: AbilityRollSnapshot | null;
  build: CharacterBuildSnapshot;
  createdBy: string;
  assignedTo: string | null;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

/** Les choix bruts que le joueur soumet à la fin du wizard. */
export interface CharacterBuildInput {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  abilityMethod: AbilityMethod;
  base: AbilityRecord;
  backgroundBonuses: AbilityBonuses;
  choices: readonly CharacterChoice[];
  equipment: CharacterEquipmentSnapshot;
}

interface CharacterBuildState {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
  abilities: AbilityAssignment;
  choices: CharacterChoices;
  equipment: CharacterEquipment;
}

interface CharacterOrigin {
  campaignId: OwningCampaignId;
  createdBy: UserId;
  createdAt: string;
}

interface CharacterState {
  name: CharacterName;
  status: CharacterStatus;
  roll: AbilityRoll | null;
  build: CharacterBuildState;
  assignedTo: UserId | null;
  revision: number;
  updatedAt: string;
}

/** Ce qu'il faut pour faire naître un personnage : déjà complet, jamais à moitié. */
export interface CharacterCreationInput {
  campaignId: OwningCampaignId;
  name: CharacterName;
  createdBy: UserId;
  build: CharacterBuildInput;
  roll: AbilityRoll | null;
  now: Date;
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
 * Une fiche de personnage D&D 2024, rattachée à une campagne.
 *
 * Elle n'existe qu'une fois complète : le wizard rend sa copie d'un coup — nom,
 * caractéristiques, choix — et c'est cette copie-là qui devient le personnage.
 * Il n'y a pas d'entre-deux persisté.
 *
 * Le tirage de caractéristiques est fait côté client et n'est plus vérifié ici
 * contre quoi que ce soit de déjà enregistré : un joueur qui triche sur sa
 * propre fiche n'abîme que la sienne.
 *
 * Aucune valeur dérivée n'est stockée ici : ni PV, ni CA, ni initiative. Elles
 * sortent du moteur à chaque lecture.
 */
export class Character {
  private constructor(
    readonly id: CharacterId,
    private readonly origin: CharacterOrigin,
    private state: CharacterState,
  ) {}

  static create(input: CharacterCreationInput): Character {
    const createdAt = input.now.toISOString();

    return new Character(
      CharacterId.create(randomUUID()),
      { campaignId: input.campaignId, createdBy: input.createdBy, createdAt },
      {
        name: input.name,
        status: 'waiting_adventure',
        roll: input.roll,
        build: buildFrom(input.build, input.roll),
        assignedTo: null,
        revision: INITIAL_REVISION,
        updatedAt: createdAt,
      },
    );
  }

  static restore(snapshot: CharacterSnapshot): Character {
    return new Character(
      CharacterId.create(snapshot.id),
      {
        campaignId: OwningCampaignId.create(snapshot.campaignId),
        createdBy: UserId.create(snapshot.createdBy),
        createdAt: snapshot.createdAt,
      },
      restoreState(snapshot),
    );
  }

  get campaignId(): OwningCampaignId {
    return this.origin.campaignId;
  }

  get createdBy(): UserId {
    return this.origin.createdBy;
  }

  get createdAt(): string {
    return this.origin.createdAt;
  }

  get name(): CharacterName {
    return this.state.name;
  }

  get status(): CharacterStatus {
    return this.state.status;
  }

  get abilityRoll(): AbilityRoll | null {
    return this.state.roll;
  }

  get assignedTo(): UserId | null {
    return this.state.assignedTo;
  }

  get updatedAt(): string {
    return this.state.updatedAt;
  }

  get revision(): number {
    return this.state.revision;
  }

  /** Ce que le moteur consomme. Toujours présent, un personnage n'existe que complet. */
  get build(): CharacterBuild {
    return { ...this.state.build, level: LEVEL_ONE };
  }

  /**
   * Relance les dés sur un personnage déjà persisté — montée de niveau ou
   * correction. Rien ne vérifie plus ce tirage contre quoi que ce soit :
   * seule l'autorisation d'édition compte.
   */
  rollAbilities(roll: AbilityRoll, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);

    this.state.roll = roll;
    this.touch(now);
  }

  /**
   * Le wizard rend sa copie : on vérifie que les bonus appartiennent à
   * l'historique et que les choix couvrent ce que l'espèce et la classe
   * demandaient, puis le personnage porte son nouveau build.
   */
  finalize(build: CharacterBuildInput, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);

    this.state.build = buildFrom(build, this.state.roll);
    this.touch(now);
  }

  rename(name: CharacterName, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);
    this.state.name = name;
    this.touch(now);
  }

  /**
   * Un joueur qui crée sa propre fiche se l'attribue dans le même geste : pas
   * de passage par `assignTo`, réservé à l'attribution PAR un maître du jeu.
   */
  selfAssignToCreator(now: Date): void {
    this.state.assignedTo = this.origin.createdBy;
    this.touch(now);
  }

  assignTo(actorIsGameMaster: boolean, playerId: UserId, now: Date): void {
    if (!actorIsGameMaster) throw new OnlyGameMasterCanAssignError();
    if (this.state.assignedTo?.equals(playerId)) {
      throw new AlreadyAssignedToThisPlayerError();
    }

    this.state.assignedTo = playerId;
    this.touch(now);
  }

  unassign(actorIsGameMaster: boolean, now: Date): void {
    if (!actorIsGameMaster) throw new OnlyGameMasterCanAssignError();
    if (!this.state.assignedTo) throw new NotAssignedError();

    this.state.assignedTo = null;
    this.touch(now);
  }

  unassignForCampaignTransition(now: Date): void {
    if (!this.state.assignedTo) throw new NotAssignedError();
    this.state.assignedTo = null;
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
      if (!this.state.assignedTo?.equals(context.actorId)) {
        throw new NotEditableByActorError();
      }
      return;
    }

    const editable =
      this.origin.createdBy.equals(context.actorId) ||
      this.state.assignedTo !== null ||
      !context.creatorIsGameMaster ||
      context.actorIsCampaignOwner;

    if (!editable) throw new NotEditableByActorError();
  }

  snapshot(): CharacterSnapshot {
    return {
      id: this.id.value,
      campaignId: this.origin.campaignId.value,
      name: this.state.name.value,
      status: this.state.status,
      abilityRoll: this.state.roll?.snapshot() ?? null,
      build: buildSnapshotOf(this.state.build),
      createdBy: this.origin.createdBy.value,
      assignedTo: this.state.assignedTo?.value ?? null,
      revision: this.state.revision,
      createdAt: this.origin.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }

  private touch(now: Date): void {
    this.state.revision += REVISION_INCREMENT;
    this.state.updatedAt = now.toISOString();
  }
}

/**
 * Les trois vérifications qui rendent un personnage valide : la répartition sort
 * bien du tirage, les bonus de caractéristique appartiennent à l'historique, et
 * les choix couvrent ce que l'espèce et la classe demandaient.
 */
function buildFrom(input: CharacterBuildInput, roll: AbilityRoll | null): CharacterBuildState {
  const abilities = assignmentFrom(input, roll);
  const choices = CharacterChoices.create(input.choices);
  validateChoices({ ...input, choices });

  return {
    speciesKey: input.speciesKey,
    lineageKey: input.lineageKey,
    classKey: input.classKey,
    backgroundKey: input.backgroundKey,
    abilities,
    choices,
    equipment: CharacterEquipment.create(input.equipment),
  };
}

function assignmentFrom(input: CharacterBuildInput, roll: AbilityRoll | null): AbilityAssignment {
  const abilities = AbilityAssignment.create({
    method: input.abilityMethod,
    roll,
    base: input.base,
    backgroundBonuses: input.backgroundBonuses,
  });
  abilities.assertBonusesFit(BACKGROUNDS[input.backgroundKey].abilityBonuses);

  return abilities;
}

function restoreState(snapshot: CharacterSnapshot): CharacterState {
  return {
    name: CharacterName.create(snapshot.name),
    status: snapshot.status,
    roll: snapshot.abilityRoll ? AbilityRoll.restore(snapshot.abilityRoll) : null,
    build: restoreBuild(snapshot.build),
    assignedTo: snapshot.assignedTo ? UserId.create(snapshot.assignedTo) : null,
    revision: snapshot.revision,
    updatedAt: snapshot.updatedAt,
  };
}

const INITIAL_REVISION = 0;
const REVISION_INCREMENT = 1;

function restoreBuild(snapshot: CharacterBuildSnapshot): CharacterBuildState {
  return {
    speciesKey: snapshot.speciesKey,
    lineageKey: snapshot.lineageKey,
    classKey: snapshot.classKey,
    backgroundKey: snapshot.backgroundKey,
    abilities: AbilityAssignment.restore(snapshot.abilities),
    choices: CharacterChoices.restore(snapshot.choices),
    equipment: CharacterEquipment.restore(snapshot.equipment),
  };
}

function buildSnapshotOf(build: CharacterBuildState): CharacterBuildSnapshot {
  return {
    speciesKey: build.speciesKey,
    lineageKey: build.lineageKey,
    classKey: build.classKey,
    backgroundKey: build.backgroundKey,
    abilities: build.abilities.snapshot(),
    choices: build.choices.snapshot(),
    equipment: build.equipment.snapshot(),
  };
}
