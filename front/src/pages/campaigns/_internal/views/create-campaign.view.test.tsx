import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type FieldErrors } from "react-hook-form";
import type { CreateCampaignDto } from "@donjon-dragon/shared";
import { CreateCampaignView } from "./create-campaign.view";

// ── Helpers ──────────────────────────────────────────────────────────────────

interface HarnessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: {
    errors: FieldErrors<CreateCampaignDto>;
    onSubmit: (event: React.FormEvent) => void;
    isSubmitting: boolean;
  };
}

/**
 * La view réclame un `control` react-hook-form : seul un composant peut en
 * fabriquer un. Le harness ne fait que ça — la view reste testée sans provider.
 */
function Harness({ open, onOpenChange, form }: HarnessProps) {
  const { control } = useForm<CreateCampaignDto>({ defaultValues: { name: "" } });

  return (
    <CreateCampaignView
      open={open}
      onOpenChange={onOpenChange}
      form={{ control, ...form }}
    />
  );
}

function renderDialog(overrides: Partial<HarnessProps> = {}) {
  const props: HarnessProps = {
    open: true,
    onOpenChange: vi.fn(),
    form: { errors: {}, onSubmit: vi.fn(), isSubmitting: false },
    ...overrides,
  };

  return { ...render(<Harness {...props} />), props };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CreateCampaignView (view pure)", () => {
  it("expose toujours le bouton d'ouverture", () => {
    renderDialog({ open: false });

    expect(
      screen.getByRole("button", { name: "Nouvelle campagne" }),
    ).toBeInTheDocument();
  });

  // Le déclencheur porte le même intitulé que la modale : c'est le titre, et non le
  // texte, qui distingue la modale ouverte de son bouton d'ouverture.
  it("ne montre pas le formulaire tant que la modale est fermée", () => {
    renderDialog({ open: false });

    expect(
      screen.queryByRole("heading", { name: "Nouvelle campagne" }),
    ).not.toBeInTheDocument();
  });

  it("montre le champ de nom quand la modale est ouverte", () => {
    renderDialog();

    expect(
      screen.getByRole("heading", { name: "Nouvelle campagne" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nom de la campagne")).toBeInTheDocument();
  });

  it("demande l'ouverture au clic sur le déclencheur", async () => {
    const { props } = renderDialog({ open: false });

    await userEvent.click(
      screen.getByRole("button", { name: "Nouvelle campagne" }),
    );

    expect(props.onOpenChange).toHaveBeenCalledWith(true);
  });

  it("câble le bouton Créer à la soumission du formulaire", () => {
    // fireEvent.submit et non un clic : jsdom n'implémente pas requestSubmit, et
    // le clic ne prouverait donc rien de plus que l'attribut type vérifié ici.
    const { props } = renderDialog();
    const submitButton = screen.getByRole("button", { name: "Créer" });
    const form = submitButton.closest("form");

    expect(submitButton).toHaveAttribute("type", "submit");
    if (form) fireEvent.submit(form);

    expect(props.form.onSubmit).toHaveBeenCalled();
  });

  it("affiche le message de validation du champ", () => {
    renderDialog({
      form: {
        errors: { name: { type: "too_small", message: "Nom trop court." } },
        onSubmit: vi.fn(),
        isSubmitting: false,
      },
    });

    expect(screen.getByText("Nom trop court.")).toBeInTheDocument();
  });

  it("désactive et renomme le bouton pendant l'envoi", () => {
    renderDialog({
      form: { errors: {}, onSubmit: vi.fn(), isSubmitting: true },
    });

    expect(screen.getByRole("button", { name: "Création..." })).toBeDisabled();
  });
});
