import type { ReactNode } from "react";

interface RecordHeader {
  overline: string;
  title: string;
  /** `null` quand la source n'a pas de description : pas de chapeau vide. */
  lede: string | null;
}

interface RecordBlockProps {
  header: RecordHeader;
  children?: ReactNode;
}

/** Bloc de fiche : surtitre, titre, chapeau, puis les sections détaillées. */
function RecordBlock({ header, children }: RecordBlockProps) {
  return (
    <article className="panel-inset">
      <RecordHeading header={header} />
      {children}
    </article>
  );
}

function RecordHeading({ header }: { header: RecordHeader }) {
  return (
    <header>
      <span className="eyebrow">{header.overline}</span>
      <h2 className="mt-[5px] font-display text-title-record tracking-meta text-gold-title">
        {header.title}
      </h2>
      {header.lede ? <p className="lede mt-3.5">{header.lede}</p> : null}
    </header>
  );
}

export { RecordBlock };
export type { RecordHeader };
