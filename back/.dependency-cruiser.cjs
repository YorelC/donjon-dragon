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
        'Seuls les schemas Zod partages et le kernel y sont autorises.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: { dependencyTypes: ['npm'], pathNot: '^(zod|@donjon-dragon)' },
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
