import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CatalogSpell } from "@donjon-dragon/shared";
import { SpellGroup } from "./spell-group.view";

function aSpell(key: string, name: string): CatalogSpell {
  return { key, name, description: "", level: 0, ritual: false } as CatalogSpell;
}

const SPELLS = [aSpell("light", "Lumière"), aSpell("mage-hand", "Main de mage"), aSpell("acid-splash", "Aspersion d'acide")];

function renderGroup(selected: string[], unavailable: string[]) {
  render(
    <SpellGroup
      title="Sorts mineurs de classe"
      spells={SPELLS}
      limit={3}
      selection={{ selected, unavailable, onChange: vi.fn() }}
    />,
  );
}

/**
 * Un bouton désactivé ne reçoit pas le survol : la raison d'un sort grisé doit
 * être écrite à l'écran (B01-SOR-006, « brièvement justifiée »).
 */
describe("groupe de sorts", () => {
  it("écrit sous le groupe pourquoi un sort est grisé", () => {
    renderGroup([], ["light"]);

    expect(screen.getByRole("button", { name: "Lumière" })).toBeDisabled();
    expect(screen.getByText(/Déjà connus.*: Lumière\./)).toBeInTheDocument();
  });

  it("laisse retirer un sort coché mais connu ailleurs, et le signale", () => {
    renderGroup(["light"], ["light"]);

    expect(screen.getByRole("button", { name: "Lumière" })).toBeEnabled();
    expect(screen.getByText(/À retirer.*: Lumière\./)).toBeInTheDocument();
  });

  it("n'écrit rien quand aucun sort n'est pris ailleurs", () => {
    renderGroup(["light"], []);

    expect(screen.queryByText(/Déjà connus|À retirer/)).not.toBeInTheDocument();
  });
});
