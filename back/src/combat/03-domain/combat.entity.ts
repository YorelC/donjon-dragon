import type { Stats } from '../../character/03-domain/character.entity.js';
import type { DiceType } from './dice.entity.js';

export type Condition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'
  | 'exhaustion';

export type Combatant = {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hitPoints: { current: number; max: number };
  stats: Stats;
  conditions: Condition[];
};

export type AttackRoll = {
  attackerId: string;
  targetId: string;
  attackRoll: number;
  advantage: 'none' | 'advantage' | 'disadvantage';
};

export type AttackResult = {
  hit: boolean;
  critical: 'none' | 'success' | 'failure';
  damage?: number;
  damageType?: string;
  description: string;
};

export type DamageRoll = {
  die: DiceType;
  count: number;
  modifier: number;
};

export type CombatLogEntry = {
  turn: number;
  round: number;
  actorId: string;
  action: string;
  result: string;
  timestamp: string;
};

export type CombatStatus = 'pending' | 'active' | 'paused' | 'completed';

export type CombatState = {
  id: string;
  roomId: string;
  participants: Combatant[];
  turnOrder: string[];
  currentTurnIndex: number;
  round: number;
  status: CombatStatus;
  log: CombatLogEntry[];
};
