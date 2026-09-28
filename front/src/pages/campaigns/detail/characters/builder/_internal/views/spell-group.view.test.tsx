import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CatalogSpell } from "@donjon-dragon/shared";
import type { SpellOrigins } from "../types/spell-origins";
import { SpellGroup } from "./spell-group.view";

function aSpell(key: string, name: string): CatalogSpell {
  return { key, name, description: "", level: 0, ritual: false } as CatalogSpell;
}

const SPELLS = [aSpell("light", "Lumière"), aSpell("mage-hand", "Main de mage"), aSpell("mending", "Réparation")];

const ORIGINS: SpellOrigins = {
  mending: { kind: "granted", label: "Gnome des roches" },
  light: { kind: "chosen", label: "Sorts mineurs — Historique" },
};

function renderGroup(selected: string[], unavailable: string[]) {
  render(
    <SpellGroup
      title="Sorts mineurs de classe"
      spells={SPELLS}
      limit={3}
      selection={{ selected, unavailable, origins: ORIGINS, onChange: vi.fn() }}
    />,
  );
}

/**
 * Un bouton désactivé ne reçoit pas le survol : la raison d'un sort grisé doit
 * être écrite à l'écran (B01-SOR-006, « brièvement justifiée »), source nommée.
 */
describe("groupe de sorts", () => {
  it("nomme ce qui accorde un sort grisé", () => {
    renderGroup([], ["mending"]);

    expect(screen.getByRole("button", { name: "Réparation" })).toBeDisabled();
    expect(screen.getByText("Accordé par Gnome des roches : Réparation.")).toBeInTheDocument();
  });

  it("nomme le groupe qui a déjà pris un sort grisé", () => {
    renderGroup([], ["light"]);

    expect(screen.getByText("Déjà choisi dans Sorts mineurs — Historique : Lumière.")).toBeInTheDocument();
  });

  it("laisse retirer un sort coché mais connu ailleurs, et dit par quoi", () => {
    renderGroup(["mending"], ["mending"]);

    expect(screen.getByRole("button", { name: "Réparation" })).toBeEnabled();
    expect(screen.getByText("À retirer, déjà accordé par Gnome des roches : Réparation.")).toBeInTheDocument();
  });

  it("n'écrit rien quand aucun sort n'est pris ailleurs", () => {
    renderGroup(["light"], []);

    expect(screen.queryByText(/Accordé par|Déjà choisi|À retirer/)).not.toBeInTheDocument();
  });
});
