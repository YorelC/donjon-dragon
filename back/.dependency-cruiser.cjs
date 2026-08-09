/**
 * Fitness functions de l'architecture back. Ces regles ne sont pas des voeux :
 * `pnpm lint` les execute et elles cassent le build.
 *
 * ESLint ne sait raisonner que sur la chaine d'import ecrite dans le fichier ;
 * dependency-cruiser resout les alias et raisonne sur des chemins, ce qui permet
 * d'exprimer des regles de COUCHE et de MODULE, pas de texte.
 *
 * Le sens des fleches est sacre, les cloisons entre dossiers ne le sont pas :
 * un application/ peut dependre de n'importe quel domain/ du meme contexte.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-infra-from-core',
      comment:
        "LA regle qui compte : le coeur (domain, application) ne connait jamais " +
        "un detail technique. Elle vaut a l'interieur d'un module comme entre modules. " +
        "Les doubles de test vivent dans <module>/testing/, donc aucune exemption " +
        'pour les fichiers de test.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/(application|domain)' },
      to: { path: '^src/modules/[^/]+/infrastructure' },
    },
    {
      name: 'no-framework-in-domain',
      comment:
        'Le domaine doit rester vrai si on jette NestJS, Mongoose et HTTP. ' +
        "L'exemption porte sur le chemin RESOLU (node_modules/zod/...), pas sur le " +
        "nom du module : ecrite '^zod' elle ne matchait jamais, et le garde-fou " +
        'ne tenait que par accident de resolution.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: { dependencyTypes: ['npm'], pathNot: 'node_modules/(zod|@donjon-dragon)/' },
    },
    {
      name: 'no-framework-in-kernel-domain',
      comment:
        "kernel/domain est le socle de domaine partage : la meme purete s'y " +
        'applique. La regle precedente ne visait que src/modules/*/domain.',
      severity: 'error',
      from: { path: '^src/kernel/domain' },
      to: { dependencyTypes: ['npm'], pathNot: 'node_modules/(zod|@donjon-dragon)/' },
    },
    {
      name: 'no-infra-from-presentation',
      comment:
        "Un controller traduit du HTTP en appel de use-case. S'il touche un " +
        'adapter Mongo, la couche application devient contournable.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/presentation' },
      to: { path: '^src/modules/[^/]+/infrastructure' },
    },
    {
      name: 'no-application-from-domain',
      comment:
        "Le sens des fleches vaut AUSSI a l'interieur d'un module : le domaine ne " +
        'connait pas les ports ni les use-cases qui l orchestrent.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/domain' },
      to: { path: '^src/modules/$1/(application|presentation)' },
    },
    {
      name: 'no-infra-from-testing',
      comment:
        'Un double de test remplace un adapter, il ne s appuie pas dessus. ' +
        "Sinon le test valide l'infrastructure qu'il pretend remplacer.",
      severity: 'error',
      from: { path: '^src/modules/[^/]+/testing' },
      to: { path: '^src/modules/[^/]+/infrastructure' },
    },
    {
      name: 'scripts-are-not-a-backdoor',
      comment:
        "src/scripts/ n'etait regi par AUCUNE regle : c'est le seul endroit qui " +
        'traversait librement toutes les couches et tous les modules. Un script ' +
        "d'outillage passe par les use-cases et le domaine, pas par les adapters " +
        "des autres modules — sauf sa propre connexion Mongo, qu'il assemble.",
      severity: 'error',
      from: { path: '^src/scripts/' },
      to: { path: '^src/modules/[^/]+/presentation' },
    },
    {
      name: 'no-cross-module-presentation',
      comment:
        "La presentation d'un module est son entree HTTP, pas une API interne : " +
        'un autre module ne la traverse jamais.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/(?!$1)[^/]+/presentation' },
    },
    {
      name: 'user-repository-is-private',
      comment:
        "Toute ecriture dans l'agregat User passe par user/application/. Avec le " +
        'repository en main, un autre module contournerait les invariants ' +
        "(unicite email/pseudo) : il y aurait alors deux endroits a corriger le " +
        "jour ou une contrainte change, et on en oublierait un.",
      severity: 'error',
      from: { pathNot: '^src/modules/user/' },
      to: { path: '^src/modules/user/application/ports/user-repository\\.port' },
    },
    {
      name: 'friendship-is-downstream',
      comment:
        'Sens de dependance assume : friendship connait user, jamais l inverse. ' +
        'Si user ou auth doit reagir a une amitie, ce sera par un event.',
      severity: 'error',
      from: { path: '^src/modules/(user|auth)/' },
      to: { path: '^src/modules/friendship/' },
    },
    {
      name: 'no-testing-doubles-in-production-code',
      comment:
        'Les doubles de <module>/testing/ ne sont importables que par des tests.',
      severity: 'error',
      from: { path: '^src/', pathNot: '\\.test\\.ts$' },
      to: { path: '^src/modules/[^/]+/testing/' },
    },
    {
      name: 'common-and-kernel-know-no-business',
      comment:
        'common/ est de la plomberie NestJS et kernel/ un socle partage : ni l un ' +
        'ni l autre ne connait un module metier. C est ce qui permet au filtre ' +
        'd exception de mapper une erreur par sa NATURE et non par sa classe.',
      severity: 'error',
      from: { path: '^src/(common|kernel)/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'no-circular',
      comment:
        'Une dependance circulaire signale une frontiere non resolue. On la corrige, ' +
        'on ne la contourne pas avec forwardRef().',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment:
        "Un fichier que personne n'importe est du code mort. Exemptions : les " +
        "points d'entree (main, script de seed), les declarations ambiantes, les " +
        'fichiers de test et les schemas Mongoose (consommes par forFeature).',
      severity: 'error',
      from: {
        orphan: true,
        pathNot: [
          '^src/main\\.ts$',
          '^src/scripts/',
          '\\.d\\.ts$',
          '\\.test\\.ts$',
        ],
      },
      to: {},
    },
  ],

  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js', '.json'],
    },
  },
};
