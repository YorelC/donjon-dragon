import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/atoms/tooltip";
import type { AbilityHint } from "../types/ability-hints";

interface AbilityNameViewProps {
  label: string;
  hint: AbilityHint | undefined;
}

/**
 * Le nom d'une caractéristique, souligné en pointillé : seul le texte ouvre
 * l'infobulle, la ligne garde ses propres commandes.
 */
export function AbilityNameView({ label, hint }: AbilityNameViewProps) {
  if (!hint) return <span className="ability-name">{label}</span>;

  return (
    <Tooltip>
      <TooltipTrigger type="button" className="ability-name hint-term">
        {label}
      </TooltipTrigger>
      <TooltipContent side="right">
        <AbilityHintText hint={hint} />
      </TooltipContent>
    </Tooltip>
  );
}

function AbilityHintText({ hint }: { hint: AbilityHint }) {
  return (
    <>
      <span data-slot="tooltip-title" className="block">{hint.name}</span>
      <span className="mt-[5px] block">{hint.description}</span>
      <span className="mt-[5px] block">Compétences : {hint.skills}.</span>
    </>
  );
}
