import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  /** La zone d'action de l'ecran, alignee a droite du titre. */
  children?: ReactNode;
}

/**
 * L'en-tete d'un ecran ouvert dans un panneau : ou l'on est, et ce qu'on peut y
 * faire, sur une seule ligne. D'ou l'on vient, le fil d'Ariane du bandeau le dit.
 */
function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <h1 className="page-title min-w-0">{title}</h1>
      {children ? (
        <div className="flex shrink-0 items-center gap-2.5">{children}</div>
      ) : null}
    </header>
  );
}

export { PageHeader };
