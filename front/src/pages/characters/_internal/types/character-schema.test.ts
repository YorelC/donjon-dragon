import { describe, expect, it } from "vitest";
import { CreateCharacterSchema } from "./character-schema";

const validDto = {
  name: "Aragorn",
  race: "Human",
  class: "Ranger",
  level: 5,
  stats: {
    strength: 16,
    dexterity: 14,
    constitution: 15,
    intelligence: 10,
    wisdom: 12,
    charisma: 13,
  },
};

describe("CreateCharacterSchema", () => {
  it("accepts a valid character DTO", () => {
    const result = CreateCharacterSchema.safeParse(validDto);
    expect(result.success).toBe(true);
  });

  it("defaults level to 1 when omitted", () => {
    const { level, ...rest } = validDto;
    const result = CreateCharacterSchema.parse(rest);
    expect(result.level).toBe(1);
  });

  it("rejects a name that is too short", () => {
    const result = CreateCharacterSchema.safeParse({ ...validDto, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown race", () => {
    const result = CreateCharacterSchema.safeParse({ ...validDto, race: "Orc" });
    expect(result.success).toBe(false);
  });

  it("rejects a stat outside the 3-20 range", () => {
    const result = CreateCharacterSchema.safeParse({
      ...validDto,
      stats: { ...validDto.stats, strength: 25 },
    });
    expect(result.success).toBe(false);
  });
});
