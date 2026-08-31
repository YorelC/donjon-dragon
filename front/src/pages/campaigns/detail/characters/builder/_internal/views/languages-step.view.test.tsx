import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { aCatalog } from "../types/catalog.fixture";
import { EMPTY_COMPOSITION } from "../types/character-composition";
import { LanguagesStepView } from "./languages-step.view";

const CATALOG = aCatalog();

function renderStep(standardLanguages = EMPTY_COMPOSITION.standardLanguages) {
  const onChange = vi.fn();
  render(
    <LanguagesStepView
      catalog={CATALOG}
      composition={{ ...EMPTY_COMPOSITION, standardLanguages }}
      onChange={onChange}
    />,
  );

  return onChange;
}

/**
 * Ce que la validité d'étape ne peut pas prouver : ce qui est à l'écran. Une
 * langue rare invalide l'étape, mais si le sélecteur l'offre, le joueur perd
 * son temps à découvrir qu'elle ne compte pas.
 */
describe("sélecteur de langues", () => {
  it("offre les neuf langues standards du catalogue", () => {
    renderStep();

    CATALOG.languages.standard.forEach((language) => {
      expect(screen.getByRole("button", { name: language.name })).toBeInTheDocument();
    });
  });

  it("n’offre pas le Commun, déjà connu de tous", () => {
    renderStep();

    expect(screen.queryByRole("button", { name: /commun/i })).not.toBeInTheDocument();
  });

  it("n’offre aucune langue rare", () => {
    renderStep();

    CATALOG.languages.rare.forEach((language) => {
      expect(screen.queryByRole("button", { name: language.name })).not.toBeInTheDocument();
    });
  });

  it("ferme le choix une fois les deux emplacements pris", () => {
    renderStep(["elvish", "orc"]);

    expect(screen.getByRole("button", { name: "giant" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "elvish" })).toBeEnabled();
  });

  it("ajoute puis retire une langue", async () => {
    const onChange = renderStep(["elvish"]);

    await userEvent.click(screen.getByRole("button", { name: "orc" }));
    expect(onChange).toHaveBeenCalledWith({ standardLanguages: ["elvish", "orc"] });

    await userEvent.click(screen.getByRole("button", { name: "elvish" }));
    expect(onChange).toHaveBeenCalledWith({ standardLanguages: [] });
  });
});
