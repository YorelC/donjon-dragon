import { randomUUID } from 'crypto';
import { UserId } from '@kernel/domain/user-id';

import {
  AbilityAssignment,
  type AbilityAssignmentSnapshot,
  type AbilityBonuses,
} from './ability-assignment';
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
  AbilitiesNotRolledError,
  AlreadyAssignedToThisPlayerError,
  CharacterAlreadyReadyError,
  CharacterNotReadyError,
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

export type CharacterStatus = 'draft' | 'ready';

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
  build: CharacterBuildSnapshot | null;
  createdBy: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Les choix bruts que le joueur soumet à la fin du wizard. */
export interface CharacterBuildDraft {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  classKey: ClassKey;
  backgroundKey: BackgroundKey;
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
  build: CharacterBuildState | null;
  assignedTo: UserId | null;
  updatedAt: string;
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
 * Elle naît en `draft` : un nom, et rien d'autre. Le tirage des caractéristiques
 * s'y pose ensuite, puis les choix du joueur la font passer en `ready`. Cet
 * ordre est ce qui rend le tirage infalsifiable — la répartition se vérifie
 * contre un tirage déjà persisté.
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

  static start(
    campaignId: OwningCampaignId,
    name: CharacterName,
    createdBy: UserId,
    now: Date,
  ): Character {
    const createdAt = now.toISOString();

    return new Character(
      CharacterId.create(randomUUID()),
      { campaignId, createdBy, createdAt },
      {
        name,
        status: 'draft',
        roll: null,
        build: null,
        assignedTo: null,
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

  get isReady(): boolean {
    return this.state.status === 'ready';
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

  /** Ce que le moteur consomme. `null` tant que le personnage est un brouillon. */
  get build(): CharacterBuild | null {
    if (!this.state.build) return null;

    return { ...this.state.build, level: LEVEL_ONE };
  }

  /**
   * Relancer les dés reste libre tant que le personnage n'est pas terminé, et
   * devient impossible ensuite : sinon un joueur retirerait jusqu'à obtenir six 18
   * en gardant sa fiche.
   */
  rollAbilities(roll: AbilityRoll, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);
    if (this.isReady) throw new CharacterAlreadyReadyError();

    this.state.roll = roll;
    this.touch(now);
  }

  /** Le wizard rend sa copie : on vérifie tout, puis le personnage devient jouable. */
  finalize(draft: CharacterBuildDraft, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);
    const roll = this.state.roll;
    if (!roll) throw new AbilitiesNotRolledError();

    this.state.build = buildFrom(draft, roll);
    this.state.status = 'ready';
    this.touch(now);
  }

  rename(name: CharacterName, context: CharacterAccessContext, now: Date): void {
    this.assertEditableBy(context);
    this.state.name = name;
    this.touch(now);
  }

  /** Le moteur refuse un brouillon : il n'y a pas de fiche à calculer. */
  assertIsReady(): void {
    if (!this.isReady) throw new CharacterNotReadyError();
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
      createdAt: this.origin.createdAt,
      updatedAt: this.state.updatedAt,
    };
  }

  private touch(now: Date): void {
    this.state.updatedAt = now.toISOString();
  }
}

/**
 * Les trois vérifications qui rendent un personnage valide : la répartition sort
 * bien du tirage, les bonus de caractéristique appartiennent à l'historique, et
 * les choix couvrent ce que l'espèce et la classe demandaient.
 */
function buildFrom(draft: CharacterBuildDraft, roll: AbilityRoll): CharacterBuildState {
  const abilities = AbilityAssignment.create({
    roll,
    base: draft.base,
    backgroundBonuses: draft.backgroundBonuses,
  });
  abilities.assertBonusesFit(BACKGROUNDS[draft.backgroundKey].abilityBonuses);

  const choices = CharacterChoices.create(draft.choices);
  validateChoices({ ...draft, choices });

  return {
    speciesKey: draft.speciesKey,
    lineageKey: draft.lineageKey,
    classKey: draft.classKey,
    backgroundKey: draft.backgroundKey,
    abilities,
    choices,
    equipment: CharacterEquipment.create(draft.equipment),
  };
}

function restoreState(snapshot: CharacterSnapshot): CharacterState {
  return {
    name: CharacterName.create(snapshot.name),
    status: snapshot.status,
    roll: snapshot.abilityRoll ? AbilityRoll.restore(snapshot.abilityRoll) : null,
    build: restoreBuild(snapshot.build),
    assignedTo: snapshot.assignedTo ? UserId.create(snapshot.assignedTo) : null,
    updatedAt: snapshot.updatedAt,
  };
}

function restoreBuild(snapshot: CharacterBuildSnapshot | null): CharacterBuildState | null {
  if (!snapshot) return null;

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

function buildSnapshotOf(build: CharacterBuildState | null): CharacterBuildSnapshot | null {
  if (!build) return null;

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
