import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EMPTY_COMPOSITION, type CharacterComposition } from "../types/character-composition";
import { aCatalog, aSpeciesWithSizeChoice } from "../types/catalog.fixture";
import { IdentityStepView } from "./identity-step.view";

const CATALOG = aCatalog({ species: [aSpeciesWithSizeChoice("human")] });

/** La view est contrôlée : sans état autour, chaque frappe repartirait d'un champ vide. */
function StatefulIdentity() {
  const [composition, setComposition] = useState<CharacterComposition>({
    ...EMPTY_COMPOSITION,
    speciesKey: "human",
  });

  return (
    <IdentityStepView
      binding={{
        catalog: CATALOG,
        composition,
        onChange: (patch) => setComposition((current) => ({ ...current, ...patch })),
        preview: () => undefined,
      }}
      isFrozen={false}
    />
  );
}

describe("échelles physiques de l’identité", () => {
  it("affiche les bornes de l’espèce pour la taille et le poids", () => {
    render(<StatefulIdentity />);

    expect(screen.getByRole("slider", { name: "Taille" })).toHaveAttribute("min", "61");
    expect(screen.getByRole("slider", { name: "Taille" })).toHaveAttribute("max", "213");
    expect(screen.getByRole("slider", { name: "Poids" })).toHaveAttribute("min", "17");
    expect(screen.getByRole("slider", { name: "Poids" })).toHaveAttribute("max", "123");
  });

  it("laisse taper une valeur dont les premiers chiffres sont sous la borne basse", async () => {
    render(<StatefulIdentity />);

    await userEvent.type(screen.getByLabelText("Taille en cm"), "175");

    expect(screen.getByLabelText("Taille en cm")).toHaveValue(175);
    expect(screen.getByRole("slider", { name: "Taille" })).toHaveValue("175");
  });
});

describe("détails narratifs de l’identité", () => {
  it("les affiche avant la description avec la limite partagée", () => {
    render(<StatefulIdentity />);

    const traits = screen.getByLabelText("Traits de personnalité (facultatif)");
    const ideals = screen.getByLabelText("Idéaux (facultatif)");
    const bonds = screen.getByLabelText("Liens (facultatif)");
    const flaws = screen.getByLabelText("Défauts (facultatif)");
    const description = screen.getByLabelText("Description (facultative)");

    [traits, ideals, bonds, flaws, description].forEach((field) => {
      expect(field).toHaveAttribute("maxlength", "1000");
    });
    expect(traits.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
  });

  it("conserve la saisie d’un trait de personnalité", async () => {
    render(<StatefulIdentity />);

    const field = screen.getByLabelText("Traits de personnalité (facultatif)");
    await userEvent.type(field, "Curieux et prudent.");

    expect(field).toHaveValue("Curieux et prudent.");
  });
});
