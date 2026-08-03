# La chaîne séquentielle : un ticket à la fois, puis remontée de vérification

Règle absolue : **aucun développement en parallèle**. Un seul ticket actif sur le board à tout instant. Ce document définit la chaîne et le mécanisme qui la rend séquentielle.

## 1. Pourquoi la parenté, et pas un réglage de concurrence

La clé `kanban.max_in_progress` n'existe pas dans cette version d'Hermès (seul `max_in_progress_per_profile` est reconnu). La séquentialité ne peut donc pas venir d'un plafond global : **elle vient du graphe**. Un ticket passe en `ready` uniquement quand tous ses parents sont `done`. Si la chaîne est strictement linéaire, un seul ticket est `ready` à la fois, et un seul worker tourne. C'est plus robuste qu'un compteur, parce que c'est structurel.

## 2. La chaîne, de Margarette au scribe

```
Charly ⇄ margarette          dialogue Discord, réponses R-NNN
        │
        ▼  [SPEC]            assignee: analyste      (sans parent)
        ▼  [DECOUPE]         assignee: orchestrateur (parent: SPEC)
        ▼  [ARCH]            assignee: architecte    (parent: DECOUPE)
        ▼  [DESIGN]          assignee: designer      (parent: ARCH)      — si UI
        ▼  [TEST]            assignee: testeur       (parent: DESIGN ou ARCH)
        ▼  [FEAT-1]          assignee: ouvrier       (parent: TEST)
        ▼  [FEAT-2]          assignee: ouvrier       (parent: FEAT-1)
        ▼  [FEAT-n]          assignee: ouvrier       (parent: FEAT-(n-1))
        ▼  [REVIEW]          assignee: revieweur     (parent: FEAT-n)
        ▼  [INTEG]           assignee: testeur       (parent: REVIEW)
        ▼  [OPS]             assignee: devops        (parent: INTEG)
        ▼  [DOC]             assignee: scribe        (parent: OPS)
        ▼  [AUDIT]           assignee: revieweur     (parent: DOC)       — la remontée
        │
        ▼  margarette annonce l'épic terminé à Charly
```

Chaque ticket a **exactement un parent : celui qui le précède**. Aucune branche, aucun ticket avec deux parents. Si tu vois deux tickets `ready` en même temps, le graphe est faux.

## 3. Le dual-sandbox survit à la séquentialisation

L'objection évidente : si le testeur passe avant les devs, comment garantir qu'ils travaillent indépendamment ? Réponse : **le dual-sandbox est une règle de lecture, pas de simultanéité**, et l'ordre choisi le renforce.

Le `[TEST]` vient **avant** les `[FEAT]`. Quand le testeur travaille, l'implémentation n'existe pas encore : il lui est physiquement impossible de la lire. C'est une garantie plus forte qu'une interdiction, et c'est aussi le cycle RED puis GREEN qu'impose AGENTS.md.

Les devs, eux, gardent leur interdiction de lire les fichiers de test. Ils implémentent depuis les UA recopiées intégralement dans leur ticket et depuis les contrats, jamais depuis les tests.

**Conséquence sur la DoD des tickets [FEAT]** : en mode séquentiel, `pnpm typecheck` et `pnpm lint` restent bloquants, mais `pnpm test` devient partiellement informatif. Les tests des UA du ticket courant doivent passer ; ceux des UA des tickets suivants échouent encore, c'est normal et ce n'est pas un motif de blocage. C'est le `[REVIEW]` qui exige le vert intégral.

## 4. La remontée : le ticket [AUDIT]

Une fois la doc écrite, on remonte toute la chaîne à l'envers pour vérifier qu'aucun maillon n'a dérivé. C'est un ticket `[AUDIT][M]` assigné au `revieweur`, dernier de la chaîne.

Il vérifie, dans cet ordre, en partant de la fin :

1. **DOC vs OPS** : le changelog et la doc utilisateur décrivent-ils ce qui a réellement été déployé, et rien de plus ?
2. **OPS vs REVIEW** : le commit déployé est-il bien celui qui a été approuvé ? aucun commit intercalé non revu ?
3. **REVIEW vs UA** : la revue a-t-elle statué sur toutes les UA, ou seulement sur une partie ?
4. **Tests vs UA** : chaque UA de la spec a-t-elle au moins un test nommé `UA-NNN:` qui passe ? Lister les UA sans test.
5. **Code vs UA** : chaque UA est-elle réellement implémentée ? Un test vert peut masquer une UA non implémentée si le test est trop permissif.
6. **Contrats vs UA** : chaque UA a-t-elle son INV dans la matrice du contrat ? Les UA marquées « front pur » sans INV sont-elles justifiées ?
7. **UA vs R** : chaque réponse R-NNN de Charly est-elle couverte par au moins une UA (matrice de traçabilité de la spec) ? Une décision de Charly perdue en route est le défaut le plus grave.
8. **Commits** : chaque commit porte-t-il ses tags `[t_xxxx][UA-NNN]` ? Aucun fichier de production dans un commit `test(...)` ?

**Sortie** : un verdict `GO` ou `NO-GO`, et pour chaque rupture constatée un ticket créé vers le profil compétent, avec le maillon exact qui a lâché. L'épic n'est annoncé terminé à Charly qu'après un `GO`.

## 5. Ce que ça coûte, et pourquoi c'est le bon compromis

Une chaîne séquentielle est plus lente qu'une chaîne parallèle : le temps total est la somme des tickets, pas le maximum. Sur douze tickets à quelques minutes chacun, on parle de dizaines de minutes au lieu de quelques-unes.

En échange tu obtiens trois choses. Une seule ressource sollicitée à la fois, donc aucune contention (décisif si `ouvrier` repasse sur le LLM local). Un état du dépôt toujours cohérent : aucun agent ne modifie un fichier qu'un autre est en train de lire, ce qui a causé la moitié des incidents constatés. Et une lisibilité totale : à tout instant, un seul ticket est en cours, donc `hermes kanban list` répond sans ambiguïté à la question « où en est-on ? ».
