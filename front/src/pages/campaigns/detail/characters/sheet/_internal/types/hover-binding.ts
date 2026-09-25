/** L'entrée survolée d'une liste, et de quoi la changer : le panneau de détail la lit. */
export interface HoverBinding<T> {
  current: T | null;
  onEnter: (entry: T) => void;
  onLeave: () => void;
}
