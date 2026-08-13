/**
 * Lancer de dés, en tant que dépendance explicite — même raison d'être que
 * `clock.port.ts`, et même discipline.
 *
 * Le domaine ne lance JAMAIS de dé lui-même : un tirage est une source non
 * déterministe, au même titre que l'heure, et `.claude/rules/back-layer-domain.md`
 * les interdit toutes les deux. Le use-case détient le dé, tire, et passe le
 * résultat au domaine en paramètre.
 *
 * Le tirage vit au back et nulle part ailleurs. Un tirage fait dans le navigateur
 * n'est pas un tirage : rien n'empêche un client de renvoyer six 18. Le serveur
 * lance, persiste ce qu'il a lancé, et refuse ensuite toute répartition qui ne
 * soit pas une permutation exacte de ce tirage.
 */
export interface Dice {
  /** Un entier uniforme dans [1, sides]. */
  roll(sides: number): number;
}

export const DICE = Symbol('Dice');
