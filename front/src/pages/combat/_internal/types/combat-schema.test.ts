import { describe, expect, it } from "vitest";
import { CombatStateSchema, CombatantSchema } from "./combat-schema";

const validCombatant = {
  id: "hero",
  name: "Aragorn",
  initiative: 18,
  armorClass: 15,
  hitPoints: { current: 30, max: 30 },
  stats: {
    strength: 16, dexterity: 14, constitution: 14,
    intelligence: 10, wisdom: 12, charisma: 10,
  },
  conditions: [],
};

describe("CombatantSchema", () => {
  it("accepts a valid combatant", () => {
    expect(CombatantSchema.safeParse(validCombatant).success).toBe(true);
  });

  it("rejects hit points where current exceeds max", () => {
    const result = CombatantSchema.safeParse({
      ...validCombatant,
      hitPoints: { current: 40, max: 30 },
    });
    expect(result.success).toBe(false);
  });
});

describe("CombatStateSchema", () => {
  it("accepts a valid combat state", () => {
    const state = {
      id: "combat-1",
      roomId: "room-1",
      participants: [validCombatant],
      turnOrder: ["hero"],
      currentTurnIndex: 0,
      round: 1,
      status: "active",
      log: [],
    };
    expect(CombatStateSchema.safeParse(state).success).toBe(true);
  });

  it("rejects an unknown status", () => {
    const state = {
      id: "combat-1",
      roomId: "room-1",
      participants: [validCombatant],
      turnOrder: ["hero"],
      currentTurnIndex: 0,
      round: 1,
      status: "finished",
      log: [],
    };
    expect(CombatStateSchema.safeParse(state).success).toBe(false);
  });
});
