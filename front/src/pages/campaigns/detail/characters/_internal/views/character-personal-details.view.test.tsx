import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CharacterPersonalDetailsView } from "./character-personal-details.view";

describe("CharacterPersonalDetailsView", () => {
  it("n expose que les champs encore modifiables", () => {
    render(<CharacterPersonalDetailsView {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: "Détails" }));

    expect(screen.getByLabelText("Âge")).toBeInTheDocument();
    expect(screen.getByLabelText("Poids (kg)")).toBeInTheDocument();
    expect(screen.getByLabelText("Traits de personnalité (facultatif)")).toBeInTheDocument();
    expect(screen.getByLabelText("Idéaux (facultatif)")).toBeInTheDocument();
    expect(screen.getByLabelText("Liens (facultatif)")).toBeInTheDocument();
    expect(screen.getByLabelText("Défauts (facultatif)")).toBeInTheDocument();
    expect(screen.getByLabelText("Description physique (facultatif)")).toHaveAttribute(
      "maxlength", "1000",
    );
    expect(screen.queryByLabelText("Nom")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Taille")).not.toBeInTheDocument();
  });

  it("bloque une saisie non positive", () => {
    render(<CharacterPersonalDetailsView {...props({ age: "0" })} />);
    fireEvent.click(screen.getByRole("button", { name: "Détails" }));

    expect(screen.getByRole("button", { name: "Enregistrer" })).toBeDisabled();
  });
});

function props(overrides: Partial<Details> = {}) {
  const values = {
    age: "34", weightKg: "19", personalityTraits: "", ideals: "",
    bonds: "", flaws: "", description: "", ...overrides,
  };
  return {
    values, isPending: false, onChange: vi.fn(), onSubmit: vi.fn(),
  };
}

interface Details {
  age: string;
  weightKg: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  description: string;
}
