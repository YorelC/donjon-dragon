/**
 * Les deux seuls noms de la mécanique de session que le front ET le back doivent
 * connaître.
 *
 * Les cookies d'access et de refresh n'ont rien à faire ici : ils sont `httpOnly`,
 * donc le front ne les lit jamais et leur nom est un détail interne du back. Le
 * jeton CSRF, lui, doit être lu par le JavaScript de la page pour être recopié en
 * en-tête — c'est précisément ce qui prouve au serveur qu'un script de son origine
 * a pu le lire, ce qu'un formulaire inter-site ne peut pas faire.
 *
 * Ces deux chaînes sont donc un contrat : si l'une dérive d'un côté, toutes les
 * mutations partent en 403. D'où une source unique.
 */
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';
