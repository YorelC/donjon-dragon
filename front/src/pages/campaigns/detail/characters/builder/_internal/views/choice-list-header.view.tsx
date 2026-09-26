interface ChoiceListHeader {
  label: string;
  chosen: number;
  total: number;
}

/**
 * L'en-tête d'une liste de choix : son intitulé, puis « 1 / 3 ». Titre de niveau
 * 3, posé directement dans son groupe : le parcours e2e remonte du titre au
 * groupe pour y trouver les options.
 */
export function ChoiceListHeaderView({ header }: { header: ChoiceListHeader }) {
  return (
    <h3 className="choice-list-header">
      <span className="section-label">{header.label}</span>{" "}
      <span className="text-note tracking-value text-gold-link">
        {header.chosen} / {header.total}
      </span>
    </h3>
  );
}
