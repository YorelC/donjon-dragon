import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface PageBack {
  to: string;
  label: string;
}

interface PageHeaderProps {
  back: PageBack;
  title: string;
  /** La zone d'action de l'ecran, alignee a droite du titre. */
  children?: ReactNode;
}

/**
 * L'en-tete d'un ecran ouvert dans un panneau : d'ou l'on vient, ou l'on est, et
 * ce qu'on peut y faire — le tout sur une seule ligne, comme la charte.
 */
function PageHeader({ back, title, children }: PageHeaderProps) {
  return (
    <header className="flex items-end justify-between gap-6">
      <div>
        <BackLink back={back} />
        <h1 className="page-title mt-2">{title}</h1>
      </div>
      {children ? (
        <div className="flex shrink-0 items-center gap-2.5">{children}</div>
      ) : null}
    </header>
  );
}

function BackLink({ back }: { back: PageBack }) {
  return (
    <Link
      to={back.to}
      className="eyebrow inline-flex items-center gap-2 transition-colors duration-[.18s] hover:text-gold-link-hover"
    >
      <span aria-hidden>&larr;</span>
      {back.label}
    </Link>
  );
}

export { PageHeader };
