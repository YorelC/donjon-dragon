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
      catalog={CATALOG}
      composition={composition}
      onChange={(patch) => setComposition((current) => ({ ...current, ...patch }))}
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
