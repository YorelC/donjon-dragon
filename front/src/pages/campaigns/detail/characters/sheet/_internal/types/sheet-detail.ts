/** Ce que le panneau de détail montre d'une ligne survolée. */
export interface SheetDetail {
  name: string;
  meta: string;
  /** Le texte de règle, en prose ; `null` quand seules les lignes chiffrées parlent. */
  description: string | null;
  lines: string[];
}
