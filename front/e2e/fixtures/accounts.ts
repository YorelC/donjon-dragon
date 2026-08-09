/**
 * Comptes du seed (`pnpm seed`), source unique pour toute la suite.
 *
 * Ces tests ne peuvent PAS créer leurs propres comptes : l'inscription exige une
 * vérification d'email, et il n'y a pas de boîte mail à cliquer dans un test. On
 * travaille donc sur des comptes préexistants et déjà vérifiés — ce qui impose
 * qu'un test nettoie derrière lui (voir `fixtures/api.ts`).
 *
 * Une convention pour éviter que deux specs se marchent sur les pieds : chaque
 * spec s'approprie un compte « acteur » et n'utilise les autres que comme cibles.
 */
export interface Account {
  readonly email: string;
  readonly displayName: string;
  readonly password: string;
}

export const ACCOUNTS = {
  /** Acteur principal : c'est lui qu'on connecte dans la plupart des specs. */
  gandalf: {
    email: 'gandalf@middleearth.com',
    displayName: 'Gandalf',
    password: 'WizardOfMithrandir42',
  },
  /** Second acteur, pour tout ce qui demande deux sessions simultanées. */
  legolas: {
    email: 'legolas@mirkwood.com',
    displayName: 'Legolas',
    password: 'BowmasterElf99',
  },
  /** Cibles passives : jamais connectées, seulement cherchées et sollicitées. */
  gimli: {
    email: 'gimli@ironforge.com',
    displayName: 'Gimli',
    password: 'DwarfAxeMaster77',
  },
  frodo: {
    email: 'frodo@shire.com',
    displayName: 'Frodo',
    password: 'RingBearerHobbit88',
  },
} as const satisfies Record<string, Account>;

/** Un mot de passe valide au regard du schéma, mais qui n'est celui de personne. */
export const WRONG_PASSWORD = 'CeMotDePasseEstFaux99';
