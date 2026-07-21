import type { CombatState, CombatLogEntry } from '@donjon-dragon/shared/combat-schema';

export interface CombatStatePort {
  get(combatId: string): Promise<CombatState | null>;
  save(combatId: string, state: CombatState): Promise<void>;
  delete(combatId: string): Promise<void>;
  addLogEntry(combatId: string, entry: CombatLogEntry): Promise<void>;
}
