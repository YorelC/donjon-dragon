/**
 * Lecture de l'heure, en tant que dépendance explicite.
 *
 * Le domaine ne lit JAMAIS l'horloge lui-même : ses fabriques et ses transitions
 * reçoivent `now` en paramètre. Trois raisons, dans l'ordre d'importance :
 *
 * 1. Un agrégat qui appelle `new Date()` en interne n'est pas déterministe. Deux
 *    exécutions du même code donnent deux résultats, et un test ne peut que
 *    contourner — en tolérant une marge, ce qui le rend flottant.
 * 2. Les comportements qui DEPENDENT du temps (expiration d'un token, fenêtre de
 *    grâce de dix secondes sur la rotation) ne sont testables qu'en choisissant
 *    l'instant. Sinon il faut attendre réellement, ou accepter de ne pas les
 *    tester aux bords.
 * 3. L'heure est une entrée du système, comme une requête HTTP. La cacher dans le
 *    domaine, c'est y cacher un appel au monde extérieur.
 *
 * La couche application détient l'horloge et la passe au domaine. Elle vit ici, au
 * niveau du kernel, parce que les trois modules en ont besoin — et qu'aucun n'a
 * de raison d'en posséder une version différente.
 */
export interface Clock {
  now(): Date;
}

export const CLOCK = Symbol('Clock');
