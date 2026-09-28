import type { ResolvedItem } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { toItemFacts, toItemKicker } from "../utils/item-detail";
import { DetailFactsView } from "./detail-facts.view";

const HINT =
  "Survolez un objet pour sa fiche : poids, prix, statistiques et usage. Cliquez-le pour la garder affichée ; un second clic la relâche.";
const NO_CATALOG_ENTRY = "Objet choisi à la création, sans fiche au catalogue.";

/** La fiche d'un objet du barda, telle que le catalogue la décrit. */
export function ItemDetailAsideView({ item }: { item: ResolvedItem | null }) {
  return (
    <aside className="sheet-aside" aria-live="polite">
      <SectionHeading label="Fiche de l'objet" />
      {item ? <ItemSheet item={item} /> : <p className="fine-print">{HINT}</p>}
    </aside>
  );
}

function ItemSheet({ item }: { item: ResolvedItem }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="font-display text-[15px] tracking-meta text-gold-title">{item.name}</span>
      <span className="text-meta tracking-title text-gold/72 uppercase">{toItemKicker(item)}</span>
      {item.detail ? <DetailFactsView facts={toItemFacts(item.detail)} /> : null}
      <ItemDescription text={item.detail ? item.detail.description : NO_CATALOG_ENTRY} />
    </div>
  );
}

function ItemDescription({ text }: { text: string | null }) {
  if (!text) return null;

  return <p className="sheet-prose">{text}</p>;
}
