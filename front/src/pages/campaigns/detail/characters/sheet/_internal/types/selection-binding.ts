/**
 * Une liste qu'on survole et qu'on épingle : le survol l'emporte le temps qu'il
 * dure, l'entrée épinglée revient dès qu'il cesse.
 */
export interface SelectionBinding<T> {
  shown: T | null;
  pinned: T | null;
  onEnter: (entry: T) => void;
  onLeave: () => void;
  onSelect: (entry: T) => void;
}
