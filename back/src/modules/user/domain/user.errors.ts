// Modes d'échec du domaine user — purs, zéro I/O.
// Mappés en codes HTTP par l'interface qui déclenche l'action (ex: register
// dans auth → ConflictException). Voir friendship/DESIGN.md.

export class DisplayNameAlreadyTakenError extends Error {
  constructor() {
    super('Display name already taken');
    this.name = 'DisplayNameAlreadyTakenError';
  }
}
