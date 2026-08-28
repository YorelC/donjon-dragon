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
 *
 * Deux pieges de resolution, verifies sur le graphe reel (`depcruise src
 * --output-type json`) et non supposes :
 *   - un builtin Node sort en dependencyTypes ['core'], JAMAIS 'npm' : une regle
 *     qui filtre sur 'npm' ne le voit pas (voir no-node-builtins-in-domain) ;
 *   - @donjon-dragon/shared n'est pas un paquet installe mais un alias tsconfig,
 *     il resout en '../shared/src/*.ts' et n'est donc jamais 'npm' non plus.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-infra-from-core',
      comment:
        "LA regle qui compte : le coeur (domain, application) ne connait jamais " +
        "un detail technique. Elle vaut a l'interieur d'un module comme entre modules. " +
        "Les doubles de test vivent dans <module>/testing/, donc aucune exemption " +
        "pour les fichiers de test. kernel/infrastructure est dans la cible : sans " +
        "ca, un use-case pourrait injecter SystemClock au lieu du port CLOCK, ce qui " +
        'redonnerait au coeur un acces direct au temps reel.',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|kernel)/(application|domain)' },
      to: { path: '^src/(modules/[^/]+|kernel)/infrastructure' },
    },
    {
      name: 'no-framework-in-domain',
      comment:
        'Le domaine doit rester vrai si on jette NestJS, Mongoose et HTTP. ' +
        "L'exemption porte sur le chemin RESOLU (node_modules/zod/...), pas sur le " +
        "nom du module : ecrite '^zod' elle ne matchait jamais, et le garde-fou " +
        'ne tenait que par accident de resolution. Elle est ANTICIPEE : aucun ' +
        'fichier domain/ n importe zod aujourd hui, on autorise le parsing de ' +
        'value object le jour ou il arrivera.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain' },
      to: { dependencyTypes: ['npm'], pathNot: 'node_modules/zod/' },
    },
    {
      name: 'no-framework-in-kernel-domain',
      comment:
        "kernel/domain est le socle de domaine partage : la meme purete s'y " +
        'applique. La regle precedente ne visait que src/modules/*/domain.',
      severity: 'error',
      from: { path: '^src/kernel/domain' },
      to: { dependencyTypes: ['npm'], pathNot: 'node_modules/zod/' },
    },
    {
      name: 'no-node-builtins-in-domain',
      comment:
        "Un builtin Node sort en dependencyTypes ['core'], pas ['npm'] : les deux " +
        'regles ci-dessus filtrent sur npm et ne le voyaient donc PAS. Neuf ' +
        'fichiers domain/ importaient crypto sans qu aucune regle ne bronche, ' +
        'alors que randomUUID est une source non deterministe exactement comme ' +
        "Date.now() — deja sorti derriere le port CLOCK. L'exemption crypto est " +
        "un choix assume (l'id d'un agregat est genere par l'agregat), elle est " +
        'ecrite ici pour rester une decision et non un angle mort du filtre.',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|kernel)/domain' },
      to: { dependencyTypes: ['core'], pathNot: '^(node:)?crypto$' },
    },
    {
      name: 'domain-knows-only-neutral-shared',
      comment:
        'shared/ porte le contrat HTTP partage avec le front. Le domaine ne peut ' +
        'en dependre que pour du vocabulaire neutre (les codes d erreur), le reste ' +
        'est du transport. Ce chemin echappait aux regles npm ci-dessus : ' +
        "@donjon-dragon/shared est un alias tsconfig vers ../shared/src, pas un " +
        'paquet de node_modules. En warn : la seule violation connue ' +
        '(auth/domain/token/access-token-payload.ts) est assumee et commentee sur ' +
        'place, on la rend visible sans casser le build.',
      severity: 'warn',
      from: { path: '^src/(modules/[^/]+|kernel)/domain' },
      to: { path: '^\\.\\./shared/src/', pathNot: '^\\.\\./shared/src/error-schema' },
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
        'connait ni les ports, ni les use-cases, ni les controllers. Sans ' +
        'backreference $1 : elle vaut aussi entre modules, sinon user/domain ' +
        'pouvait importer auth/application.',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|kernel)/domain' },
      to: { path: '^src/(modules/[^/]+|kernel)/(application|presentation)' },
    },
    {
      name: 'no-presentation-from-application',
      comment:
        'Un use-case ignore par quel transport on l appelle. S il importe un DTO ' +
        'de controller, le HTTP remonte dans la couche metier et le use-case ' +
        'devient inappelable depuis un script ou un consumer.',
      severity: 'error',
      from: { path: '^src/(modules/[^/]+|kernel)/application' },
      to: { path: '^src/modules/[^/]+/presentation' },
    },
    {
      name: 'no-presentation-from-infrastructure',
      comment:
        'Un adapter sortant ne connait pas le point d entree entrant du module. ' +
        "S il en importe une classe, l'infrastructure se met a dependre du " +
        'transport au lieu de son port, et le sens des dependances s inverse.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/infrastructure' },
      to: { path: '^src/modules/[^/]+/presentation' },
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
        "est un composition root assume : comme app.module.ts il a le droit " +
        "d'assembler des adapters et de posseder son horloge reelle — le seed en " +
        'a besoin, il reutilise l id existant pour rester rejouable. Ce qui lui ' +
        "reste interdit, c'est l'entree HTTP d'un module : un script qui appelle " +
        'un controller reimplemente le transport au lieu du metier.',
      severity: 'error',
      from: { path: '^src/scripts/' },
      to: { path: '^src/modules/[^/]+/presentation' },
    },
    {
      name: 'no-cross-module-presentation',
      comment:
        "La presentation d'un module est son entree HTTP, pas une API interne : " +
        'un autre module ne la traverse jamais. Ecrite path + pathNot plutot ' +
        "qu'avec une lookahead (?!$1) : c'est l'idiome documente, et il se relit " +
        'sans se demander si la substitution de $1 precede la compilation de la regex.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/[^/]+/presentation', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'no-cross-module-infrastructure',
      comment:
        "L'infrastructure d'un module est privee, y compris pour le cablage DI " +
        "d'un autre module. C'etait le dernier chemin non garde : no-infra-from-core, " +
        '-presentation et -testing couvrent les couches, personne ne couvrait le ' +
        "x.module.ts — or c'est precisement la qu'on ecrit un useClass. Sans cette " +
        'regle, auth.module.ts pouvait enregistrer MongoUserRepository comme ' +
        'provider et injecter le contournement partout dans auth.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/[^/]+/infrastructure', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'ports-are-module-private',
      comment:
        "Un port exprime le besoin INTERNE d'un module : un autre module appelle " +
        'son use-case, pas son port. Avec le repository en main il contournerait ' +
        'les invariants (unicite email/pseudo) : il y aurait alors deux endroits ' +
        'a corriger le jour ou une contrainte change, et on en oublierait un. ' +
        "Generalise l'ancienne regle qui ne citait que user-repository.port : le " +
        'module suivant recreait le probleme sans etre couvert.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { path: '^src/modules/[^/]+/application/ports', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'ports-are-not-reachable-from-outside',
      comment:
        "Meme cloison depuis ce qui n'est pas un module. La regle precedente " +
        'capture le module d origine dans son `from`, donc elle ne peut viser que ' +
        'des fichiers de modules : sans ce complement, un script, common/ ou ' +
        'kernel/ piochaient librement dans les ports.',
      severity: 'error',
      from: { path: '^src/', pathNot: '^src/modules/' },
      to: { path: '^src/modules/[^/]+/application/ports' },
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
      name: 'campaigns-is-downstream',
      comment:
        'Jumelle de la precedente, un cran plus bas : campaigns connait user et ' +
        'friendship (il resout un pseudo, il verifie une amitie avant une ' +
        "invitation), aucun des deux ne connait campaigns. Sans cette regle, la " +
        "dependance pourrait s'inverser le jour ou user voudra afficher les " +
        "campagnes d'un profil — et le cycle ne se verrait qu'au forwardRef.",
      severity: 'error',
      from: { path: '^src/modules/(user|auth|friendship)/' },
      to: { path: '^src/modules/campaigns/' },
    },
    {
      name: 'items-is-downstream',
      comment:
        "Le catalogue d'objets connaitra campaigns le jour ou un MJ inventera un " +
        'objet chez lui ; aucun module au-dessus ne connait items. Sans cette ' +
        "regle, campaigns irait lire le catalogue pour afficher un butin et le " +
        'cycle ne se verrait quau forwardRef.',
      severity: 'error',
      from: { path: '^src/modules/(user|auth|friendship|campaigns)/' },
      to: { path: '^src/modules/items/' },
    },
    {
      name: 'characters-is-downstream',
      comment:
        'Le dernier cran : characters connait campaigns, items et user (il verifie ' +
        "une appartenance, il resout des cles d'objet, il resout un pseudo " +
        "d'assignation), aucun des quatre ne connait characters. La regle manquait " +
        "alors que la dependance existait deja : rien n'empechait campaigns d'aller " +
        "chercher les personnages d'une campagne, et le cycle ne se serait vu qu'au " +
        'forwardRef.',
      severity: 'error',
      from: { path: '^src/modules/(user|auth|friendship|campaigns|items)/' },
      to: { path: '^src/modules/characters/' },
    },
    {
      name: 'no-testing-doubles-in-production-code',
      comment:
        'Les doubles de <module>/testing/ et de kernel/testing/ ne sont importables ' +
        'que par des tests. Une FixedClock qui fuirait en production gelerait le temps.',
      severity: 'error',
      from: {
        path: '^src/',
        // Un double a le droit de s'appuyer sur un autre double — une fixture qui
        // utilise l'horloge de test, par exemple. Ce qu'on interdit, c'est la fuite
        // vers du code de PRODUCTION.
        pathNot: ['\\.test\\.ts$', '^src/(modules/[^/]+|kernel)/testing/'],
      },
      to: { path: '^src/(modules/[^/]+|kernel)/testing/' },
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
