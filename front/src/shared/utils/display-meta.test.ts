import { describe, it, expect } from "vitest";
import { MISSING_META, toInitials } from "./display-meta";

describe("toInitials", () => {
  it.each([
    { name: "Gandalf", expected: "Ga" },
    { name: "legolas", expected: "Le" },
    { name: "  Brunehilde  ", expected: "Br" },
    { name: "La Malédiction de Strahd", expected: "La" },
  ])("réduit $name à $expected", ({ name, expected }) => {
    expect(toInitials(name)).toBe(expected);
  });

  it("signale un nom vide au lieu d'inventer des initiales", () => {
    expect(toInitials("   ")).toBe(MISSING_META);
  });
});
