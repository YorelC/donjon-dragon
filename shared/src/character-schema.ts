import { z } from 'zod';

import {
  AbilitySchema,
  AlignmentSchema,
  BackgroundKeySchema,
  ClassKeySchema,
  EffectSourceTypeSchema,
  LanguageSchema,
  OriginFeatKeySchema,
  SkillNameSchema,
  SpeciesKeySchema,
  CreatureSizeSchema,
} from './dnd-reference-schema.js';
import { UserSummarySchema } from './user-schema.js';

/**
 * Bornes du nom de personnage, en un seul endroit — même logique que
 * `CAMPAIGN_NAME_RULES` : le back valide avec ce schéma, le formulaire du front
 * réutilise `characterNameField`.
 */
export const CHARACTER_NAME_RULES = {
  min: 2,
  max: 50,
} as const;

export const characterNameField = () =>
  z
    .string()
    .trim()
    .min(CHARACTER_NAME_RULES.min, {
      message: `Le nom du personnage doit contenir au moins ${CHARACTER_NAME_RULES.min} caractères.`,
    })
    .max(CHARACTER_NAME_RULES.max, {
      message: `Le nom du personnage ne peut pas dépasser ${CHARACTER_NAME_RULES.max} caractères.`,
    });

// ---------------------------------------------------------------------------
// Caractéristiques
// ---------------------------------------------------------------------------

/**
 * Un score issu de 4d6 dont on garde les trois meilleurs tient forcément entre
 * 3 et 18. Les bonus d'historique s'appliquent après, côté serveur.
 */
export const ABILITY_SCORE_RULES = {
  min: 3,
  max: 18,
} as const;

const abilityScoreField = () =>
  z.number().int().min(ABILITY_SCORE_RULES.min).max(ABILITY_SCORE_RULES.max);

export const AbilityScoresSchema = z.object({
  strength: abilityScoreField(),
  dexterity: abilityScoreField(),
  constitution: abilityScoreField(),
  intelligence: abilityScoreField(),
  wisdom: abilityScoreField(),
  charisma: abilityScoreField(),
});

/** L'historique donne +2 et +1, ou +1 sur chacune de ses trois caractéristiques. */
const backgroundBonusField = () => z.union([z.literal(1), z.literal(2)]).optional();

export const BackgroundAbilityBonusesSchema = z.object({
  strength: backgroundBonusField(),
  dexterity: backgroundBonusField(),
  constitution: backgroundBonusField(),
  intelligence: backgroundBonusField(),
  wisdom: backgroundBonusField(),
  charisma: backgroundBonusField(),
});

/**
 * Les trois façons de fixer ses caractéristiques. Le serveur vérifie chacune à
 * sa manière : permutation du tirage persisté, permutation du tableau standard,
 * ou bornes et budget pour l'achat de points.
 */
/** La seule methode qui s'appuie sur un tirage, et donc sur un tirage emis. */
export const ROLL_METHOD = 'roll';

export const AbilityMethodSchema = z.enum(['roll', 'standardArray', 'pointBuy']);

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_COSTS: Readonly<Record<number, number>> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_BOUNDS = { min: 8, max: 15 } as const;

export const DICE_PER_ABILITY_ROLL = 4;
export const ABILITY_ROLL_COUNT = 6;

/**
 * Le résultat d'un tirage, tel que le serveur le renvoie : les dés bruts en plus
 * des totaux, pour que le front puisse les animer et que le joueur puisse
 * refaire le calcul.
 */
export const AbilityRollSchema = z.object({
  dice: z
    .array(z.array(z.number().int().min(1).max(6)).length(DICE_PER_ABILITY_ROLL))
    .length(ABILITY_ROLL_COUNT),
  totals: z
    .array(z.number().int().min(ABILITY_SCORE_RULES.min).max(ABILITY_SCORE_RULES.max))
    .length(ABILITY_ROLL_COUNT),
});

/**
 * Ce que rend l'émission d'un tirage : les dés, leurs totaux, et l'identité qui
 * permettra à la création de désigner ce tirage-là et pas un autre.
 */
export const IssuedAbilityRollSchema = AbilityRollSchema.extend({
  rollId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Choix de création
// ---------------------------------------------------------------------------

export const ChoiceSourceSchema = z.object({
  type: EffectSourceTypeSchema,
  key: z.string().min(1),
  grantedBy: z
    .object({
      type: z.enum(['background', 'species']),
      key: z.string().min(1),
    })
    .optional(),
});

/**
 * Un choix fait à la création, avec sa provenance. Tous les champs sont
 * optionnels : une source en remplit rarement plus d'un ou deux.
 */
export const CharacterChoiceSchema = z.object({
  source: ChoiceSourceSchema,
  skills: z.array(SkillNameSchema).optional(),
  expertise: z.array(SkillNameSchema).optional(),
  tools: z.array(z.string()).optional(),
  languages: z.array(LanguageSchema).optional(),
  spells: z.array(z.string()).optional(),
  originFeat: OriginFeatKeySchema.optional(),
  spellcastingAbility: AbilitySchema.optional(),
  spellList: ClassKeySchema.optional(),
  /** Le don de Style de combat du guerrier. */
  fightingStyle: z.string().optional(),
  /** L'option d'Ordre divin (clerc) ou d'Ordre primitif (druide). */
  classOrder: z.string().optional(),
  weaponMasteries: z.array(z.string()).optional(),
  invocation: z.string().optional(),
  invocationSpells: z.array(z.string()).optional(),
  familiarForm: z.string().optional(),
  pactWeaponKey: z.string().optional(),
  spellbook: z.array(z.string()).optional(),
  feature: z.string().optional(),
});

/** Une ligne d'inventaire : la clé d'un objet du catalogue, en tant d'exemplaires. */
export const CharacterItemSchema = z.object({
  itemKey: z.string().min(1),
  quantity: z.number().int().positive(),
});

/**
 * Ce que porte et ce que possède le personnage.
 *
 * `armorKey` et `shield` disent ce qu'il PORTE — eux seuls entrent dans le calcul
 * de la classe d'armure. `items` et `gold` disent ce qu'il POSSÈDE, et sortent
 * des options de paquetage retenues.
 *
 * Les deux identifiants d'option gardent la trace du choix : sans eux, rouvrir
 * le wizard en édition obligerait à deviner l'option d'origine en recomparant
 * les inventaires. Ils sont nullables — les personnages créés avant que
 * l'équipement existe n'en ont aucun.
 */
export const CharacterEquipmentSchema = z.object({
  armorKey: z.string().nullable(),
  shield: z.boolean(),
  items: z.array(CharacterItemSchema),
  gold: z.number().int().nonnegative(),
  classOptionId: z.string().nullable(),
  backgroundOptionId: z.string().nullable(),
  classChoiceItemKey: z.string().nullable().optional(),
  backgroundChoiceItemKey: z.string().nullable().optional(),
  trinketId: z.number().int().min(1).max(100).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Requêtes
// ---------------------------------------------------------------------------

/**
 * Le wizard rend sa copie complète — un personnage n'existe qu'à ce moment-là,
 * jamais avant. Cette composition est la forme commune aux deux commandes, et
 * n'est exportée par aucune des deux : `CreateCharacterSchema` la referme pour
 * le `POST`, `FinalizeCharacterSchema` pour le `PUT`, et leurs invariants de
 * tirage sont opposés. Les confondre casse l'édition — c'est arrivé une fois.
 *
 * Le tirage de caractéristiques n'est plus fait côté client : le serveur l'émet
 * et le conserve. La composition ne transporte donc que `abilityRollId`, la
 * référence du tirage à consommer — `null` pour les deux méthodes sans tirage,
 * et sur `PUT`, où le personnage garde le sien.
 */
const CharacterCompositionSchema = z.object({
  name: characterNameField(),
  alignment: AlignmentSchema.optional(),
  age: z.number().int().positive().optional(),
  heightCm: z.number().positive().optional(),
  weightKg: z.number().positive().optional(),
  description: z.string().nullable().optional(),
  speciesKey: SpeciesKeySchema,
  lineageKey: z.string().nullable(),
  standardLanguages: z.array(LanguageSchema).optional(),
  classKey: ClassKeySchema,
  backgroundKey: BackgroundKeySchema,
  abilityMethod: AbilityMethodSchema,
  base: AbilityScoresSchema,
  backgroundBonuses: BackgroundAbilityBonusesSchema,
  choices: z.array(CharacterChoiceSchema),
  equipment: CharacterEquipmentSchema,
  abilityRollId: z.string().uuid().nullable(),
});

/**
 * Le corps du `POST`. La création est le seul moment où un tirage se désigne :
 * la méthode et le tirage doivent s'accorder.
 */
export const CreateCharacterSchema = CharacterCompositionSchema.superRefine(
  (value, context) => {
    requireCompleteIdentity(value, context);
    requireRollMatchesMethod(value, context);
  },
);

export const CharacterRevisionSchema = z.number().int().nonnegative();

/**
 * Le corps du `PUT`. Le personnage garde le tirage qu'il a déjà : l'édition
 * n'en désigne aucun, quelle que soit sa méthode. Le serveur le recharge depuis
 * le personnage persisté.
 */
export const FinalizeCharacterSchema = CharacterCompositionSchema.extend({
  expectedRevision: CharacterRevisionSchema,
}).superRefine(
  (value, context) => {
    requireCompleteIdentity(value, context);
    refuseRollOnEdit(value, context);
  },
);

/** L'aperçu du wizard : les mêmes choix, mais rien n'est persisté ni vérifié. */
export const PreviewCharacterSheetSchema = CharacterCompositionSchema.omit({
  name: true,
  abilityRollId: true,
}).superRefine(requireCompleteOrigin);

type RollCandidate = {
  abilityMethod?: unknown;
  abilityRollId?: unknown;
};

type IdentityCandidate = {
  alignment?: unknown;
  age?: unknown;
  heightCm?: unknown;
  weightKg?: unknown;
  standardLanguages?: unknown;
};

function requireCompleteIdentity(value: IdentityCandidate, context: z.RefinementCtx): void {
  requireCompleteOrigin(value, context);
  addRequiredIssue(value.alignment, 'alignment', context);
  addRequiredIssue(value.age, 'age', context);
  addRequiredIssue(value.heightCm, 'heightCm', context);
  addRequiredIssue(value.weightKg, 'weightKg', context);
}

/**
 * La méthode et le tirage vont ensemble ou pas du tout. Sans cette règle, un
 * `pointBuy` pourrait désigner un tirage — que le serveur consommerait avant de
 * l'ignorer, brûlant un tirage pour rien.
 */
function refuseRollOnEdit(value: RollCandidate, context: z.RefinementCtx): void {
  if (!value.abilityRollId) return;
  addIssue('abilityRollId', 'An existing character keeps its ability roll', context);
}

function requireRollMatchesMethod(value: RollCandidate, context: z.RefinementCtx): void {
  const needsRoll = value.abilityMethod === ROLL_METHOD;
  if (needsRoll && !value.abilityRollId) {
    addIssue('abilityRollId', 'An ability roll is required for the roll method', context);
  }
  if (!needsRoll && value.abilityRollId) {
    addIssue('abilityRollId', 'This ability method takes no ability roll', context);
  }
}

function requireCompleteOrigin(value: IdentityCandidate, context: z.RefinementCtx): void {
  addRequiredIssue(value.standardLanguages, 'standardLanguages', context);
}

function addRequiredIssue(
  value: unknown,
  field: string,
  context: z.RefinementCtx,
): void {
  if (value !== undefined) return;
  addIssue(field, 'Required', context);
}

function addIssue(field: string, message: string, context: z.RefinementCtx): void {
  context.addIssue({ code: z.ZodIssueCode.custom, path: [field], message });
}

export const AssignCharacterSchema = z.object({
  playerDisplayName: z.string().trim().min(1),
  expectedRevision: z.number().int().nonnegative(),
});

export const UnassignCharacterSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
});

export const CharacterIdSchema = z.string().uuid();

// ---------------------------------------------------------------------------
// Réponses
// ---------------------------------------------------------------------------

/**
 * Ce que la liste affiche d'un personnage : les noms viennent des données de
 * référence du back, le front ne les recalcule pas. Toujours présent — un
 * personnage n'existe en base que déjà complet.
 */
export const CharacterBuildSummarySchema = z.object({
  speciesKey: SpeciesKeySchema,
  speciesName: z.string(),
  lineageName: z.string().nullable(),
  classKey: ClassKeySchema,
  className: z.string(),
  backgroundKey: BackgroundKeySchema,
  backgroundName: z.string(),
});

/**
 * Le build d'un personnage déjà créé, dans la forme granulaire qu'attend le
 * wizard pour se pré-remplir en édition. Les choix bruts de `choices[]` sont
 * déjà éclatés côté serveur — le front n'a pas à rejouer le classement sort
 * mineur / sort de niveau 1. Contrairement à la composition du wizard, rien
 * n'est nullable ici « faute d'avoir encore choisi » : un personnage persisté
 * est toujours complet.
 */
export const CharacterBuildDetailSchema = z.object({
  name: characterNameField(),
  alignment: AlignmentSchema,
  age: z.number().int().positive(),
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  description: z.string().nullable(),

  speciesKey: SpeciesKeySchema,
  lineageKey: z.string().nullable(),
  size: CreatureSizeSchema,
  standardLanguages: z.array(LanguageSchema),
  /** Celle du sort mineur de lignée, distincte de celle d'Initié à la magie. */
  lineageSpellcastingAbility: AbilitySchema.nullable(),
  speciesSkills: z.array(SkillNameSchema),
  speciesFeat: OriginFeatKeySchema.nullable(),

  classKey: ClassKeySchema,
  classSkills: z.array(SkillNameSchema),
  expertise: z.array(SkillNameSchema),
  classCantrips: z.array(z.string()),
  classSpells: z.array(z.string()),
  fightingStyle: z.string().nullable(),
  classOrder: z.string().nullable(),
  weaponMasteries: z.array(z.string()),
  /** Les outils que la CLASSE fait choisir — barde, moine. */
  classTools: z.array(z.string()),
  classLanguage: LanguageSchema.nullable(),
  invocation: z.string().nullable(),
  invocationSpells: z.array(z.string()),
  familiarForm: z.string().nullable(),
  pactWeaponKey: z.string().nullable(),
  spellbook: z.array(z.string()),

  backgroundKey: BackgroundKeySchema,
  /** L'outil que l'HISTORIQUE fait choisir ; `null` quand il l'impose. */
  backgroundTool: z.string().nullable(),
  backgroundBonuses: BackgroundAbilityBonusesSchema,

  featSkills: z.array(SkillNameSchema),
  featTools: z.array(z.string()),
  spellcastingAbility: AbilitySchema.nullable(),
  spellList: ClassKeySchema.nullable(),
  featCantrips: z.array(z.string()),
  featSpells: z.array(z.string()),
  magicInitiateChoices: z.array(z.object({
    grantedBy: z.object({
      type: z.enum(['background', 'species']),
      key: z.string(),
    }).nullable(),
    spellcastingAbility: AbilitySchema,
    spellList: ClassKeySchema,
    cantrips: z.array(z.string()),
    spells: z.array(z.string()),
  })),

  abilityMethod: AbilityMethodSchema,
  base: AbilityScoresSchema,
  abilityRoll: AbilityRollSchema.nullable(),

  armorKey: z.string().nullable(),
  shield: z.boolean(),
  items: z.array(CharacterItemSchema),
  gold: z.number().int().nonnegative(),
  classOptionId: z.string().nullable(),
  backgroundOptionId: z.string().nullable(),
  classChoiceItemKey: z.string().nullable(),
  backgroundChoiceItemKey: z.string().nullable(),
  trinketId: z.number().int().min(1).max(100).nullable(),
});

/**
 * `assignedTo` est un résumé du joueur, jamais son id — le client n'a pas à
 * connaître l'identité système des autres joueurs.
 *
 * `status` ne décrit pas l'avancement de la création — un personnage n'existe
 * en base que déjà complet — mais sa participation à l'aventure de la
 * campagne. `'waiting_adventure'` est la seule valeur possible pour l'instant ;
 * un futur statut `'in_adventure'` viendra restreindre l'édition au MJ une
 * fois la partie commencée.
 */
export const CharacterStatusSchema = z.enum(['waiting_adventure']);
export const CharacterValidationStatusSchema = z.enum([
  'draft', 'submitted', 'refused', 'accepted',
]);

export const CharacterPublicReviewSchema = z.object({
  status: CharacterValidationStatusSchema,
});

export const CharacterReviewSummarySchema = CharacterPublicReviewSchema.extend({
  submittedVersion: z.number().int().positive().nullable(),
  lastRejectionReason: z.string().nullable(),
});

export const CharacterSchema = z.object({
  id: CharacterIdSchema,
  campaignId: z.string().uuid(),
  name: characterNameField(),
  status: CharacterStatusSchema,
  review: CharacterReviewSummarySchema,
  build: CharacterBuildSummarySchema,
  abilityRoll: AbilityRollSchema.nullable(),
  createdByMe: z.boolean(),
  assignedTo: UserSummarySchema.nullable(),
  revision: CharacterRevisionSchema,
});

export const CharacterPoolProjectionSchema = z.object({
  id: CharacterIdSchema,
  name: characterNameField(),
  portrait: z.string().url().nullable(),
  status: CharacterStatusSchema,
  review: CharacterPublicReviewSchema,
  speciesName: z.string(),
  lineageName: z.string().nullable(),
  className: z.string(),
  level: z.number().int().min(1).max(20),
  assignmentStatus: z.enum(['assigned', 'available']),
});

export const ControlledCharacterProjectionSchema = CharacterPoolProjectionSchema.extend({
  review: CharacterReviewSummarySchema,
  build: CharacterBuildSummarySchema,
  assignedTo: UserSummarySchema.nullable(),
  revision: CharacterRevisionSchema,
});

export const GameMasterCharacterProjectionSchema =
  ControlledCharacterProjectionSchema.extend({
    createdByMe: z.boolean(),
  });

export const CampaignCharacterListItemSchema = z.discriminatedUnion('projection', [
  CharacterPoolProjectionSchema.extend({ projection: z.literal('pool') }),
  ControlledCharacterProjectionSchema.extend({ projection: z.literal('controlled') }),
  GameMasterCharacterProjectionSchema.extend({ projection: z.literal('gameMaster') }),
]);

export const CharacterAssignmentSummarySchema = z.object({
  id: CharacterIdSchema,
  revision: CharacterRevisionSchema,
  assignedTo: UserSummarySchema.nullable(),
});

export const CharacterAssignmentCommandResultSchema = z.object({
  campaignId: z.string().uuid(),
  character: CharacterAssignmentSummarySchema,
  previousCharacter: CharacterAssignmentSummarySchema.nullable(),
});

export const CharacterReviewCommandSchema = z.object({
  expectedRevision: CharacterRevisionSchema,
});

export const RejectCharacterSchema = CharacterReviewCommandSchema.extend({
  reason: z.string().trim().min(1).max(1000),
});

export const CharacterReviewCommandResultSchema = z.object({
  id: CharacterIdSchema,
  revision: CharacterRevisionSchema,
  review: CharacterReviewSummarySchema,
});

export type AbilityScores = z.infer<typeof AbilityScoresSchema>;
export type BackgroundAbilityBonuses = z.infer<typeof BackgroundAbilityBonusesSchema>;
export type AbilityMethod = z.infer<typeof AbilityMethodSchema>;
export type AbilityRoll = z.infer<typeof AbilityRollSchema>;
export type ChoiceSource = z.infer<typeof ChoiceSourceSchema>;
export type CharacterChoice = z.infer<typeof CharacterChoiceSchema>;
export type CharacterItem = z.infer<typeof CharacterItemSchema>;
export type CharacterEquipment = z.infer<typeof CharacterEquipmentSchema>;
export type CharacterStatus = z.infer<typeof CharacterStatusSchema>;
export type CharacterValidationStatus = z.infer<typeof CharacterValidationStatusSchema>;
export type CharacterReviewSummary = z.infer<typeof CharacterReviewSummarySchema>;
export type CharacterPublicReview = z.infer<typeof CharacterPublicReviewSchema>;
export type IssuedAbilityRoll = z.infer<typeof IssuedAbilityRollSchema>;
export type CreateCharacterDto = z.infer<typeof CreateCharacterSchema>;
export type FinalizeCharacterDto = z.infer<typeof FinalizeCharacterSchema>;
export type PreviewCharacterSheetDto = z.infer<typeof PreviewCharacterSheetSchema>;
export type AssignCharacterDto = z.infer<typeof AssignCharacterSchema>;
export type UnassignCharacterDto = z.infer<typeof UnassignCharacterSchema>;
export type CharacterBuildSummary = z.infer<typeof CharacterBuildSummarySchema>;
export type CharacterBuildDetailDto = z.infer<typeof CharacterBuildDetailSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type CampaignCharacterListItem = z.infer<typeof CampaignCharacterListItemSchema>;
export type CharacterAssignmentSummary = z.infer<typeof CharacterAssignmentSummarySchema>;
export type CharacterAssignmentCommandResult = z.infer<
  typeof CharacterAssignmentCommandResultSchema
>;
export type CharacterReviewCommand = z.infer<typeof CharacterReviewCommandSchema>;
export type RejectCharacterDto = z.infer<typeof RejectCharacterSchema>;
export type CharacterReviewCommandResult = z.infer<typeof CharacterReviewCommandResultSchema>;
