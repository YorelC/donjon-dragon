import * as React from "react";
import { Input } from "@/shared/components/atoms/input";
import { EyeGlyph, EyeOffGlyph } from "@/shared/components/molecules/eye-glyph";

const REVEAL_LABEL = {
  shown: "Masquer le mot de passe",
  hidden: "Afficher le mot de passe",
} as const;

/** Champ de mot de passe et son œil de dévoilement, collé au bord droit. */
function PasswordInput(props: React.ComponentProps<"input">) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <div className="relative">
      <Input {...props} type={revealed ? "text" : "password"} className="pr-11" />
      <RevealButton
        revealed={revealed}
        onToggle={() => setRevealed((shown) => !shown)}
      />
    </div>
  );
}

interface RevealButtonProps {
  revealed: boolean;
  onToggle: () => void;
}

function RevealButton({ revealed, onToggle }: RevealButtonProps) {
  return (
    <button
      type="button"
      // Le bouton n'appartient pas au parcours de saisie : on le laisse hors du
      // tabulateur pour ne pas s'interposer entre le mot de passe et l'envoi.
      tabIndex={-1}
      onClick={onToggle}
      aria-label={revealed ? REVEAL_LABEL.shown : REVEAL_LABEL.hidden}
      aria-pressed={revealed}
      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gold/55 transition-colors duration-[.18s] hover:text-gold-selected"
    >
      {revealed ? <EyeGlyph /> : <EyeOffGlyph />}
    </button>
  );
}

export { PasswordInput };
