import type { ResolvedSpellDetail } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import type { CastableSpell } from "../constants/sheet-labels";
import { toSpellFacts, toSpellKicker, type SpellFact } from "../utils/spell-detail";

const HINT =
  "Survolez un sort pour sa fiche complète. Cliquez-le pour la garder affichée ; un second clic la relâche.";

/** La fiche d'un sort, assez longue pour défiler seule sans quitter la liste. */
export function SpellDetailAsideView({ spell }: { spell: CastableSpell | null }) {
  return (
    <aside className="sheet-aside xl:max-h-[calc(100vh-40px)] xl:overflow-y-auto" aria-live="polite">
      <SectionHeading label="Fiche du sort" />
      {spell ? <SpellSheet spell={spell} /> : <p className="fine-print">{HINT}</p>}
    </aside>
  );
}

function SpellSheet({ spell }: { spell: CastableSpell }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-display text-[15px] tracking-meta text-gold-title">{spell.name}</span>
      {spell.detail ? <SpellBody detail={spell.detail} /> : null}
    </div>
  );
}

function SpellBody({ detail }: { detail: ResolvedSpellDetail }) {
  return (
    <>
      <span className="text-meta tracking-title text-gold/72 uppercase">{toSpellKicker(detail)}</span>
      <dl className="grid grid-cols-2 gap-px border border-gold/14 bg-gold/14">
        {toSpellFacts(detail).map((fact) => (
          <SpellFactCell key={fact.label} fact={fact} />
        ))}
      </dl>
      <p className="text-note/[1.7] text-ink-prose text-pretty">{detail.description}</p>
    </>
  );
}

function SpellFactCell({ fact }: { fact: SpellFact }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 bg-card px-2.5 py-2", fact.wide && "col-span-2")}>
      <dt className="sheet-caption">{fact.label}</dt>
      <dd className="text-sm/[1.4] text-foreground">{fact.value}</dd>
    </div>
  );
}
