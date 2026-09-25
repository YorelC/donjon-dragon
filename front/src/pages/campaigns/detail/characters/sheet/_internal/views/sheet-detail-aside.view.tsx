import { SectionHeading } from "@/shared/components/molecules/section-heading";
import type { SheetDetail } from "../types/sheet-detail";

interface SheetDetailAsideViewProps {
  title: string;
  hint: string;
  detail: SheetDetail | null;
}

/** Le panneau de droite d'un onglet : l'aide tant que rien n'est survolé, le détail ensuite. */
export function SheetDetailAsideView({ title, hint, detail }: SheetDetailAsideViewProps) {
  return (
    <aside className="sheet-aside" aria-live="polite">
      <SectionHeading label={title} />
      {detail ? <DetailBody detail={detail} /> : <p className="fine-print">{hint}</p>}
    </aside>
  );
}

function DetailBody({ detail }: { detail: SheetDetail }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-[15px] tracking-meta text-gold-title">{detail.name}</span>
      <span className="text-meta tracking-title text-gold/72 uppercase">{detail.meta}</span>
      <ul className="flex flex-col gap-1.5 border-t border-gold/16 pt-2.5">
        {detail.lines.map((line) => (
          <DetailLine key={line} line={line} />
        ))}
      </ul>
    </div>
  );
}

function DetailLine({ line }: { line: string }) {
  return <li className="text-note/[1.7] text-ink-prose text-pretty">{line}</li>;
}
