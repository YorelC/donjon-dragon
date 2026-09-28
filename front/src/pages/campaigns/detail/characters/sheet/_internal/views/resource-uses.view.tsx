import type { ResolvedResource } from "@donjon-dragon/shared";
import { COMING_SOON } from "../constants/sheet-labels";

/** Au-delà, des pastilles ne se comptent plus d'un regard : le nombre les remplace. */
const MAX_PIPS = 6;

/**
 * Les utilisations d'une aptitude, dans la teinte de sa ligne. Pleines tant que
 * l'état d'aventure n'existe pas : elles se voient, elles ne se cochent pas.
 */
export function ResourceUsesView({ resource }: { resource: ResolvedResource }) {
  const { max } = resource;

  return (
    <span aria-disabled title={COMING_SOON} className="flex items-center gap-[5px]">
      <span className="sr-only">{max} utilisation(s) disponible(s) sur {max}</span>
      {max > MAX_PIPS ? <PipTotal max={max} /> : <Pips count={max} />}
    </span>
  );
}

function Pips({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} aria-hidden className="size-2.5 rotate-45 border border-current bg-current/70" />
      ))}
    </>
  );
}

function PipTotal({ max }: { max: number }) {
  return <span aria-hidden className="font-display text-sm tabular-nums">{max} / {max}</span>;
}
