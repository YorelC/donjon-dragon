import { cn } from "@/shared/utils/utils";
import type { DetailFact } from "../types/detail-fact";

/** La grille de contraintes d'un sort ou d'un objet, deux cases par ligne ; une case seule en fin de grille prend la ligne. */
export function DetailFactsView({ facts }: { facts: DetailFact[] }) {
  return (
    <dl className="grid grid-cols-2 gap-px border border-gold/14 bg-gold/14">
      {facts.map((entry) => (
        <DetailFactCell key={entry.label} entry={entry} />
      ))}
    </dl>
  );
}

function DetailFactCell({ entry }: { entry: DetailFact }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 bg-card px-3.5 py-2.5 odd:last:col-span-2",
        entry.wide && "col-span-2",
      )}
    >
      <dt className="sheet-caption">{entry.label}</dt>
      <dd className="text-sm/[1.4] text-foreground">{entry.value}</dd>
    </div>
  );
}
