import type { ResolvedResource } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import { COMING_SOON, RECOVERY_LABELS } from "../constants/sheet-labels";
import {
  DEFAULT_RESOURCE_TONE,
  RESOURCE_TONES,
  isIllustratedResource,
} from "../constants/resource-styles";
import { toLabel } from "../utils/sheet-format";
import { ResourceIconView } from "./resource-icon.view";

/** Au-delà, des pastilles ne se comptent plus d'un regard : le nombre les remplace. */
const MAX_PIPS = 6;

/**
 * Les ressources de classe, en tête des Aptitudes. Pleines tant que l'état
 * d'aventure n'existe pas : les pastilles se voient, elles ne se cochent pas.
 */
export function ResourceStripView({ resources }: { resources: ResolvedResource[] }) {
  if (resources.length === 0) return null;

  return (
    <section className="flex flex-col gap-[11px]">
      <SectionHeading label="Ressources" />
      <ul className="flex flex-col gap-1.5">
        {resources.map((resource) => (
          <ResourceRow key={resource.key} resource={resource} />
        ))}
      </ul>
    </section>
  );
}

function ResourceRow({ resource }: { resource: ResolvedResource }) {
  return (
    <li
      data-resource={resource.key}
      className={cn(
        "sheet-row grid grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-3 py-2",
        toneOf(resource.key),
      )}
    >
      <ResourceIconView resourceKey={resource.key} />
      <span className="min-w-0 text-sm/[1.4] text-gold-value">{resource.feature}</span>
      <ResourceCount max={resource.max} />
      <span className="sheet-tag">{toLabel(RECOVERY_LABELS, resource.recovery)}</span>
    </li>
  );
}

function ResourceCount({ max }: { max: number }) {
  return (
    <span aria-disabled title={COMING_SOON} className="flex items-center gap-[5px]">
      <span className="sr-only">{max} disponible(s) sur {max}</span>
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

function toneOf(key: string): string {
  return isIllustratedResource(key) ? RESOURCE_TONES[key] : DEFAULT_RESOURCE_TONE;
}
