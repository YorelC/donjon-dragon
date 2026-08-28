import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  MISSING_META,
  toInitials,
  toReceivedRequestMeta,
  toRelativeDate,
  toSentRequestMeta,
} from "./friend-meta";

const NOW = new Date("2026-08-28T12:00:00.000Z");

function isoDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("toInitials", () => {
  it.each([
    { name: "Gandalf", expected: "Ga" },
    { name: "legolas", expected: "Le" },
    { name: "  Brunehilde  ", expected: "Br" },
  ])("réduit $name à $expected", ({ name, expected }) => {
    expect(toInitials(name)).toBe(expected);
  });

  it("signale un pseudo vide au lieu d'inventer des initiales", () => {
    expect(toInitials("   ")).toBe(MISSING_META);
  });
});

describe("toRelativeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("nomme la veille", () => {
    expect(toRelativeDate(isoDaysAgo(1))).toBe("hier");
  });

  it("compte les jours au-delà", () => {
    expect(toRelativeDate(isoDaysAgo(5))).toContain("5 jours");
  });

  it("replie les écarts d'une minute sur l'instant", () => {
    expect(toRelativeDate(NOW.toISOString())).toBe("à l'instant");
  });

  it("signale une date illisible", () => {
    expect(toRelativeDate("pas une date")).toBe(MISSING_META);
  });
});

// Un ami est un compte, pas un personnage : ni classe, ni niveau, ni presence.
// Seules les demandes portent une meta, parce qu'elles portent une vraie date.
describe("méta des demandes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("date une demande reçue, sans rien y ajouter", () => {
    expect(toReceivedRequestMeta(isoDaysAgo(1))).toBe("Demande reçue hier");
  });

  it("date une invitation envoyée, sans rien y ajouter", () => {
    expect(toSentRequestMeta(isoDaysAgo(5))).toBe(
      "Invitation envoyée il y a 5 jours",
    );
  });

  it("n'affiche aucun champ manquant", () => {
    expect(toReceivedRequestMeta(isoDaysAgo(1))).not.toContain(MISSING_META);
    expect(toSentRequestMeta(isoDaysAgo(1))).not.toContain(MISSING_META);
  });
});
