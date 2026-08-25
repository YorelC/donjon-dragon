import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/atoms/tooltip";

const ABBREVIATION_LENGTH = 2;

interface StatTokenData {
  name: string;
  effect: string;
}

/**
 * Jeton de récapitulatif : condense une liste longue — traits, sorts, maîtrises.
 * Le nom complet et l'effet passent par l'infobulle, d'où le `cursor: help`.
 */
function StatToken({ token }: { token: StatTokenData }) {
  return (
    <Tooltip>
      <TooltipTrigger className="stat-token cursor-help">
        <span className="font-display text-[13px] text-gold-value">
          {token.name.slice(0, ABBREVIATION_LENGTH)}
        </span>
        <span className="sr-only">{token.name}</span>
      </TooltipTrigger>
      <TooltipContent>
        <TokenDetail token={token} />
      </TooltipContent>
    </Tooltip>
  );
}

function TokenDetail({ token }: { token: StatTokenData }) {
  return (
    <>
      <span data-slot="tooltip-title" className="block">
        {token.name}
      </span>
      <span className="mt-[5px] block">{token.effect}</span>
    </>
  );
}

export { StatToken };
export type { StatTokenData };
