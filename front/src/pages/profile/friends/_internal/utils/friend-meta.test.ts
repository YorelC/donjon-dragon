import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  MISSING_META,
  toFriendMeta,
  toInitials,
  toReceivedRequestMeta,
  toRelativeDate,
  toSearchResultMeta,
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

// Le serveur ne renvoie ni classe, ni niveau, ni presence : la ligne doit le
// dire, jamais combler le vide. Voir docs/friends-meta-backend-gaps.md.
describe("métadonnées absentes côté serveur", () => {
  it("marque les trois champs manquants d'un ami", () => {
    expect(toFriendMeta()).toBe(
      `Classe ${MISSING_META} · Niveau ${MISSING_META} · Dernière séance ${MISSING_META}`,
    );
  });

  it("marque les deux champs manquants d'un résultat de recherche", () => {
    expect(toSearchResultMeta()).toBe(
      `Classe ${MISSING_META} · Niveau ${MISSING_META}`,
    );
  });

  it("mêle la date réelle d'une demande reçue et le trou des amis en commun", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    expect(toReceivedRequestMeta(isoDaysAgo(1))).toBe(
      `Demande reçue hier · Amis en commun ${MISSING_META}`,
    );

    vi.useRealTimers();
  });

  it("n'a aucun trou sur une invitation envoyée", () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);

    expect(toSentRequestMeta(isoDaysAgo(1))).toBe("Invitation envoyée hier");
    expect(toSentRequestMeta(isoDaysAgo(1))).not.toContain(MISSING_META);

    vi.useRealTimers();
  });
});
