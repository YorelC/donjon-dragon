import { beforeEach, describe, expect, it } from "vitest";
import { useCombatStore } from "./combat.store";
import type { CombatState } from "../types/combat-schema";

const baseState: CombatState = {
  id: "combat-1",
  roomId: "room-1",
  participants: [],
  turnOrder: ["hero"],
  currentTurnIndex: 0,
  round: 1,
  status: "active",
  log: [],
};

describe("useCombatStore", () => {
  beforeEach(() => {
    useCombatStore.setState({ currentCombat: null });
  });

  it("has no current combat by default", () => {
    expect(useCombatStore.getState().currentCombat).toBeNull();
  });

  it("sets the current combat", () => {
    useCombatStore.getState().setCurrentCombat(baseState);
    expect(useCombatStore.getState().currentCombat).toEqual(baseState);
  });

  it("merges a partial update into the current combat", () => {
    useCombatStore.getState().setCurrentCombat(baseState);
    useCombatStore.getState().updateCombat({ round: 2 });
    expect(useCombatStore.getState().currentCombat?.round).toBe(2);
  });

  it("ignores a partial update when there is no current combat", () => {
    useCombatStore.getState().updateCombat({ round: 2 });
    expect(useCombatStore.getState().currentCombat).toBeNull();
  });

  it("clears the current combat", () => {
    useCombatStore.getState().setCurrentCombat(baseState);
    useCombatStore.getState().clearCombat();
    expect(useCombatStore.getState().currentCombat).toBeNull();
  });
});
