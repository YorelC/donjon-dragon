import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/atoms/tooltip";

interface IconActionProps {
  label: string;
  children: ReactNode;
}

/**
 * Une action secondaire de la ligne tient dans un bouton-icône : sans libellé visible,
 * l'infobulle le dit. L'infobulle enveloppe le déclencheur de modale, et non
 * l'inverse, pour que la modale garde la référence de son bouton.
 */
export function IconAction({ label, children }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
