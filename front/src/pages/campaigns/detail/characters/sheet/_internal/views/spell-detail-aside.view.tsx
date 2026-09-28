import type { ResolvedSpellDetail } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import type { CastableSpell } from "../constants/sheet-labels";
import { toSpellFacts, toSpellKicker } from "../utils/spell-detail";
import { DetailFactsView } from "./detail-facts.view";

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
      <DetailFactsView facts={toSpellFacts(detail)} />
      <p className="sheet-prose">{detail.description}</p>
    </>
  );
}
