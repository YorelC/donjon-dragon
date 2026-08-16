// L'équipement de départ d'une classe ou d'un historique.
//
// Les sources (`docs/characteres/classes/*.json`, `backgrounds.json`) décrivent
// ce choix en prose, dans huit formats différents. Ici il a une forme unique :
// des options, chacune avec ce qu'elle donne en objets et en or.
//
// `label` est la phrase du manuel, affichée telle quelle. `entries` est ce qui
// atterrit dans l'inventaire. Les deux ne se recouvrent pas toujours : quand le
// manuel dit « outils d'artisan » ou « instrument de musique au choix », il
// désigne une catégorie et non un objet précis, et c'est l'étape des maîtrises
// d'outils du wizard qui tranche. La ligne reste alors dans le libellé sans
// entrer dans l'inventaire — sinon on attribuerait un objet que le joueur n'a
// pas choisi.

export interface EquipmentEntry {
  itemKey: string;
  quantity: number;
}

export interface EquipmentOption {
  /** 'A', 'B', 'C' — l'identifiant du manuel, persisté avec le personnage. */
  id: string;
  label: string;
  entries: readonly EquipmentEntry[];
  gold: number;
}

export interface StartingEquipment {
  options: readonly EquipmentOption[];
}

/** La dernière option de chaque classe et de chaque historique : tout en or. */
export function goldOnly(id: string, gold: number): EquipmentOption {
  return { id, label: `${gold} po`, entries: [], gold };
}
