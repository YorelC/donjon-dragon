import { describe, expect, it } from "vitest";
import { escapeDeepMarkers, MAX_MARKDOWN_DEPTH } from "./markdown-nesting";

const AT_LIMIT = MAX_MARKDOWN_DEPTH;

describe("escapeDeepMarkers", () => {
  it("laisse intact un texte ordinaire, listes et citations comprises", () => {
    const text = "# Indices\n- [ ] le forgeron\n  - ment\n> Prosper\n1) Bree";

    expect(escapeDeepMarkers(text)).toBe(text);
  });

  it("laisse intacte une ligne qui empile exactement la borne", () => {
    const line = "- ".repeat(AT_LIMIT) + "x";

    expect(escapeDeepMarkers(line)).toBe(line);
  });

  it("échappe le marqueur au-delà de la borne, sans rien retirer du texte", () => {
    const line = "- ".repeat(AT_LIMIT + 3) + "x";

    const escaped = escapeDeepMarkers(line);

    expect(escaped).toBe(`${"- ".repeat(AT_LIMIT)}\\- - - x`);
    expect(escaped.replace("\\", "")).toBe(line);
  });

  it("échappe la ponctuation d'un numéro, pas le chiffre", () => {
    const escaped = escapeDeepMarkers("1) ".repeat(AT_LIMIT + 1) + "x");

    expect(escaped.endsWith("1\\) x")).toBe(true);
  });

  it("traite chaque ligne à part", () => {
    const deep = ">".repeat(AT_LIMIT + 1) + "x";

    expect(escapeDeepMarkers(`ok\n${deep}\nok`)).toBe(`ok\n${">".repeat(AT_LIMIT)}\\>x\nok`);
  });
});
