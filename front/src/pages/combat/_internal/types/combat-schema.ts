import { z } from "zod";
import { StatsSchema } from "@/shared/types/stats-schema";

export const DiceTypeEnum = z.enum(["d4", "d6", "d8", "d10", "d12", "d20", "d100"]);
export const ConditionEnum = z.enum([
  "blinded", "charmed", "deafened", "frightened", "grappled",
  "incapacitated", "invisible", "paralyzed", "petrified", "poisoned",
  "prone", "restrained", "stunned", "unconscious", "exhaustion",
]);

export const HitPointsSchema = z.object({
  current: z.number().int().min(0),
  max: z.number().int().positive(),
}).refine((hp) => hp.current <= hp.max, {
  message: "current HP cannot exceed max HP",
});

export const CombatantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  initiative: z.number().int(),
  armorClass: z.number().int().min(1),
  hitPoints: HitPointsSchema,
  stats: StatsSchema,
  conditions: z.array(ConditionEnum),
});

export const AttackRollSchema = z.object({
  attackerId: z.string(),
  targetId: z.string(),
  attackRoll: z.number().int().min(1).max(30),
  advantage: z.enum(["none", "advantage", "disadvantage"]).default("none"),
});

export const AttackResultSchema = z.object({
  hit: z.boolean(),
  critical: z.enum(["none", "success", "failure"]),
  damage: z.number().int().nonnegative().optional(),
  damageType: z.string().optional(),
  description: z.string(),
});

export const CombatLogEntrySchema = z.object({
  turn: z.number().int().nonnegative(),
  round: z.number().int().positive(),
  actorId: z.string(),
  action: z.string(),
  result: z.string(),
  timestamp: z.string().datetime(),
});

export const CombatStateSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  participants: z.array(CombatantSchema),
  turnOrder: z.array(z.string()),
  currentTurnIndex: z.number().int().nonnegative(),
  round: z.number().int().positive(),
  status: z.enum(["pending", "active", "paused", "completed"]),
  log: z.array(CombatLogEntrySchema),
});

export const DiceRollSchema = z.object({
  type: DiceTypeEnum,
  count: z.number().int().min(1).max(100).default(1),
  modifier: z.number().int().default(0),
  advantage: z.boolean().default(false),
  disadvantage: z.boolean().default(false),
});

export const CombatActionSchema = z.object({
  type: z.enum(["attack", "cast", "dash", "disengage", "dodge", "help", "hide", "ready", "use-item"]),
  target: z.string().uuid().optional(),
  diceRoll: DiceRollSchema.optional(),
  description: z.string().optional(),
});

export const CombatStatusEnum = z.enum(["pending", "active", "paused", "completed"]);

export type DiceType = z.infer<typeof DiceTypeEnum>;
export type DiceRoll = z.infer<typeof DiceRollSchema>;
export type CombatAction = z.infer<typeof CombatActionSchema>;
export type CombatStatus = z.infer<typeof CombatStatusEnum>;
export type Condition = z.infer<typeof ConditionEnum>;
export type HitPoints = z.infer<typeof HitPointsSchema>;
export type Combatant = z.infer<typeof CombatantSchema>;
export type AttackRoll = z.infer<typeof AttackRollSchema>;
export type AttackResult = z.infer<typeof AttackResultSchema>;
export type CombatState = z.infer<typeof CombatStateSchema>;
export type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;
