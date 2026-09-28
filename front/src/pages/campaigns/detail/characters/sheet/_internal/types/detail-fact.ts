/** Une case de la grille d'un panneau de détail : incantation, portée, poids, prix… */
export interface DetailFact {
  label: string;
  value: string;
  /** Une valeur qui se dit en phrase prend toute la ligne. */
  wide: boolean;
}

export function fact(label: string, value: string): DetailFact {
  return { label, value, wide: false };
}

export function wideFact(label: string, value: string): DetailFact {
  return { label, value, wide: true };
}
