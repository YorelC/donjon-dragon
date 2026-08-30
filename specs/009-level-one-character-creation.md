# Spec 009 — Création serveur complète d'un personnage de niveau 1

## Références normatives

- `SF-002`, création de niveau 1 ;
- matrice validée `B01-LEVEL-ONE-CREATION.md`, 85 règles ;
- `DEC-003`, `DEC-008`, `DEC-011` et `DEC-012` ;
- `DEC-015`, Phase 5A : autorité serveur, calcul pur, projections nommées et enveloppe
  transactionnelle ;
- `DEC-016`, Phase 5B : snapshots révisés, versions immuables, reçus, audit et outbox ;
- Phase 5C : sélecteurs fermés, cardinalités exactes, provenance et échec local ;
- Spec 007 : appartenance campagne, auto-attribution atomique et lectures privées ;
- *Player's Handbook 2024*, pages pointées par B01. La table des 100 babioles des
  pages 46–47 a été contrôlée textuellement et visuellement pour cet incrément.

## Périmètre

L'incrément rend la commande de création initiale autoritaire pour l'identité, le
build, les sorts, l'équipement et la fiche calculée d'un personnage exactement au
niveau 1. Il couvre aussi l'aperçu, qui emploie le même validateur et le même moteur
sans persister.

Conformément à la demande d'incrément, la revue par le MJ, la correction après refus,
la progression, l'état d'aventure et le combat restent hors périmètre. Les lignes
`B01-VAL-002` à `B01-VAL-005` ne sont donc pas déclarées implémentées par cette spec.
L'auto-attribution et la confidentialité restent celles de la Spec 007.

## Audit initial des 85 règles

Qualification vérifiée avant modification du code : `CONFORME` signifie représenté
et contrôlé par le serveur ; `PARTIELLE`, seulement représenté ou contrôlé sur une
partie du chemin ; `ABSENTE`, non représentable ou sans contrôle utile.

| Règle | État initial | Preuve factuelle |
|---|---|---|
| B01-ID-001 | PARTIELLE | Adhésion, limite joueur, créations MJ et auto-attribution existent ; création sans reçu ni transaction. |
| B01-ID-002 | PARTIELLE | Niveau 1 et bonus +2 calculés ; aucun PX initial. |
| B01-ID-003 | PARTIELLE | Nom Zod 2–50 ; aucun verrou après acceptation. |
| B01-ID-004 | ABSENTE | Aucun alignement au contrat, domaine ou document. |
| B01-ID-005 | ABSENTE | Aucun âge. |
| B01-ID-006 | ABSENTE | Aucune taille physique ni poids. |
| B01-ID-007 | ABSENTE | Aucune description physique. |
| B01-ID-008 | ABSENTE | Projection `portrait: null`, aucun stockage ni téléversement. |
| B01-ID-009 | PARTIELLE | Douze classes, neuf espèces ; Aasimar absent. |
| B01-ID-010 | PARTIELLE | Lignage et compétences contrôlés ; autres champs de `choices[]` libres. |
| B01-CAR-001 | CONFORME | Trois méthodes et leurs permutations, bornes et budget sont validés au domaine. |
| B01-CAR-002 | CONFORME | Les dés bruts sont validés par Zod et les totaux sont recalculés avant affectation. |
| B01-CAR-003 | CONFORME | Les deux plans et les trois caractéristiques de l'historique sont contrôlés. |
| B01-CAR-004 | PARTIELLE | Les scores sont recalculés mais une valeur >20 est écrêtée au lieu d'être refusée. |
| B01-ESP-001 | PARTIELLE | Neuf profils et effets partiels ; catalogue incomplet. |
| B01-ESP-002 | ABSENTE | Aasimar non représentable. |
| B01-ESP-003 | PARTIELLE | Dix ascendances draconiques et choix de lignage ; preuve des effets incomplète. |
| B01-ESP-004 | PARTIELLE | Traits nains et PV présents ; validation transverse incomplète. |
| B01-ESP-005 | PARTIELLE | Lignage et compétence contrôlés ; caractéristique de lignée libre. |
| B01-ESP-006 | PARTIELLE | Lignage présent ; caractéristique libre et fréquence du sort contradictoire. |
| B01-ESP-007 | PARTIELLE | Six ascendances et errata du test de caractéristique présents. |
| B01-ESP-008 | PARTIELLE | Traits structurés, sans preuve transverse complète. |
| B01-ESP-009 | PARTIELLE | Compétence et don transportables ; taille et sous-choix non validés. |
| B01-ESP-010 | PARTIELLE | Traits orcs présents, sans preuve transverse complète. |
| B01-ESP-011 | PARTIELLE | Héritage présent ; taille et caractéristique non validées. |
| B01-ESP-012 | ABSENTE | La taille de référence est imposée ; aucun choix persisté. |
| B01-HIS-ACOLYTE | PARTIELLE | Octrois présents ; Initié à la magie non contrôlé. |
| B01-HIS-ARTISAN | PARTIELLE | Outil d'artisan concret absent. |
| B01-HIS-CHARLATAN | PARTIELLE | Octrois présents ; sous-choix de Doué libres. |
| B01-HIS-CRIMINAL | PARTIELLE | Octrois déterministes, sans validation transverse. |
| B01-HIS-ENTERTAINER | PARTIELLE | Instrument concret absent. |
| B01-HIS-FARMER | PARTIELLE | Octrois déterministes, sans validation transverse. |
| B01-HIS-GUARD | PARTIELLE | Boîte de jeux concrète absente. |
| B01-HIS-GUIDE | PARTIELLE | Initié à la magie non contrôlé. |
| B01-HIS-HERMIT | PARTIELLE | Octrois déterministes, sans validation transverse. |
| B01-HIS-MERCHANT | PARTIELLE | Octrois déterministes, sans validation transverse. |
| B01-HIS-NOBLE | PARTIELLE | Jeu et sous-choix de Doué libres. |
| B01-HIS-SAGE | PARTIELLE | Initié à la magie non contrôlé. |
| B01-HIS-SAILOR | PARTIELLE | Octrois déterministes, sans validation transverse. |
| B01-HIS-SCRIBE | PARTIELLE | Sous-choix de Doué libres. |
| B01-HIS-SOLDIER | PARTIELLE | Jeu concret absent. |
| B01-HIS-WAYFARER | PARTIELLE | Octrois déterministes, sans validation transverse. |
| B01-ORI-001 | PARTIELLE | Commun injecté ; aucun quota des deux langues standards. |
| B01-ORI-002 | PARTIELLE | Druidique et jargon décrits ; choix du Roublard non contrôlé. |
| B01-ORI-003 | PARTIELLE | Chaînes libres dans `tools[]`, aucun catalogue concret. |
| B01-ORI-004 | PARTIELLE | Dix dons de domaine ; don d'historique non substituable seulement par construction des effets. |
| B01-ORI-005 | PARTIELLE | Champs présents ; listes, niveaux et quotas non contrôlés. |
| B01-ORI-006 | PARTIELLE | Quotas décrits dans les effets ; valeurs soumises libres. |
| B01-CLA-BAR | PARTIELLE | Compétences et capacités ; deux maîtrises d'armes absentes. |
| B01-CLA-BARD | PARTIELLE | Capacités et quotas de référence ; instruments et sorts non contrôlés. |
| B01-CLA-CLR | PARTIELLE | Ordres et sorts transportables ; cardinalités libres. |
| B01-CLA-DRU | PARTIELLE | Ordres transportables ; druidique et sorts incomplets. |
| B01-CLA-FTR | PARTIELLE | Style transportable ; style et trois armes non contrôlés. |
| B01-CLA-MNK | PARTIELLE | Capacités ; outil concret absent. |
| B01-CLA-PAL | PARTIELLE | Capacités et sorts ; armes et sorts non contrôlés. |
| B01-CLA-RGR | PARTIELLE | Capacité et sorts ; armes et sorts non contrôlés. |
| B01-CLA-ROG | PARTIELLE | Expertise libre ; outils, langue et armes incomplets. |
| B01-CLA-SOR | PARTIELLE | Quotas de référence ; listes et cardinalités non contrôlées. |
| B01-CLA-WLK | PARTIELLE | Capacité descriptive ; aucune invocation sélectionnable. |
| B01-CLA-WIZ | PARTIELLE | Quatre sorts directs ; aucun grimoire de six. |
| B01-CLA-001 | PARTIELLE | Quotas/listes classe et doublons entre choix ; conflits avec octrois fixes non contrôlés. |
| B01-CLA-002 | ABSENTE | Aucun choix de botte d'arme concrète. |
| B01-CLA-003 | PARTIELLE | Dix styles en référence ; clé soumise libre. |
| B01-CLA-004 | ABSENTE | Invocation et sous-choix non représentés. |
| B01-SOR-001 | PARTIELLE | 99 sorts de niveaux 0–1 dans le domaine ; corpus 391 incomplet et Télépathie absente. |
| B01-SOR-002 | PARTIELLE | Résolution séparée par origine ; validation par origine absente. |
| B01-SOR-003 | PARTIELLE | Une clé inconnue est acceptée et classée comme sort de niveau 1. |
| B01-SOR-004 | PARTIELLE | Certains octrois séparés ; fréquences non structurées dans la fiche. |
| B01-SOR-005 | ABSENTE | Aucun grimoire. |
| B01-EQP-001 | PARTIELLE | Identifiants transportés ; compatibilité non contrôlée. |
| B01-EQP-002 | PARTIELLE | Objets et or viennent du client ; existence seule contrôlée. |
| B01-EQP-003 | PARTIELLE | Entrées génériques conservées ou omises. |
| B01-EQP-004 | ABSENTE | Aucune babiole. |
| B01-EQP-005 | PARTIELLE | Aucun magasin UI ; ajout arbitraire possible par HTTP. |
| B01-EQP-006 | PARTIELLE | Type d'armure contrôlé ; possession et bouclier non reliés au paquetage. |
| B01-FIC-001 | PARTIELLE | Nombreux dérivés ; PX, PV actuels, attaques et choix complets absents. |
| B01-FIC-002 | PARTIELLE | PV max calculés, PV actuels initiaux absents. |
| B01-FIC-003 | PARTIELLE | Sources sur PV, CA, initiative et vitesse seulement. |
| B01-FIC-004 | CONFORME | Aperçu et lecture appellent le même `resolveSheet`. |
| B01-VAL-001 | PARTIELLE | Création en un geste ; aucun état soumis versionné. |
| B01-VAL-002 | ABSENTE | Aucun état d'acceptation ni garde combat. |
| B01-VAL-003 | ABSENTE | Aucun use-case d'acceptation/refus. |
| B01-VAL-004 | ABSENTE | Aucun motif, version examinée ou historique de revue. |
| B01-VAL-005 | ABSENTE | Aucun verrou d'acceptation. |
| B01-VAL-006 | CONFORME | Spec 007 : chargement campagne et projections privées joueur/MJ, autres lecteurs masqués. |

**Bilan initial : 5 conformes, 65 partielles, 15 absentes.**

## Contrat de création

La commande HTTP authentifiée porte une `Idempotency-Key` Zod-validée. L'acteur vient
exclusivement de `@CurrentUser()`. L'intention canonique contient le type de commande,
la campagne et le corps validé complet. Même principal, clé et intention relisent le
résultat initial ; même clé et intention différente répondent en conflit.

Le corps représente uniquement des entrées et choix :

- identité : nom, alignement parmi neuf valeurs, âge entier positif, taille physique
  positive en centimètres, poids positif en kilogrammes, description facultative ;
- origine : espèce, lignée éventuelle, catégorie `Small`/`Medium`, historique, deux
  langues standards distinctes ;
- caractéristiques : méthode, six bases, bonus d'historique et dés bruts lorsque la
  méthode est le tirage ;
- choix sourcés : compétences, expertise, outils, langue de classe, don humain,
  caractéristique magique, style, ordre, bottes d'armes, invocation et sous-choix,
  sorts de classe/don/invocation et grimoire ;
- équipement : identifiants d'option de classe et d'historique, choix concrets promis
  par ces options, armure et bouclier portés, babiole facultative identifiée de 1 à
  100. Les objets, quantités et l'or envoyés historiquement sont ignorés au profit du
  recalcul serveur et ne deviennent jamais une source d'autorité.

Le serveur force niveau 1, 0 PX, bonus de maîtrise +2 et release de référence courante
de l'incrément. Aucune valeur dérivée n'est acceptée dans le corps.

## Invariants de composition

1. Les catalogues de création sont fermés : 10 espèces, 12 classes, 16 historiques,
   10 dons d'Origine, langues, outils, armes, styles, ordres, cinq invocations niveau 1,
   sorts et 100 babioles.
2. Chaque choix possède exactement la source qui le permet. Un champ supplémentaire
   sur une source qui ne le demande pas est refusé.
3. Les quotas sont des égalités, jamais des minima. Les doublons ne satisfont aucun
   quota et une maîtrise déjà fixe oblige à choisir une autre option autorisée.
4. Toute combinaison espèce–classe est permise ; seules les règles internes peuvent
   invalider la copie.
5. La taille D&D est distincte de la taille physique et appartient aux options de
   l'espèce.
6. Le don d'historique est imposé. Le don humain est limité aux dons d'Origine et ses
   sous-choix sont validés comme une source séparée.
7. Initié à la magie, la magie de classe, la magie d'espèce, une invocation et le
   grimoire gardent listes, niveaux, quotas et provenance distincts.
8. Le grimoire contient six sorts de Magicien niveau 1 uniques ; les quatre préparés
   sont inclus dans ces six.
9. Pacte du grimoire contient trois sorts mineurs et deux rituels niveau 1 issus de
   listes autorisées et non déjà préparés. Pacte de la chaîne et Pacte de la lame
   n'acceptent que leurs catalogues fermés.
10. Les options d'équipement appartiennent à la classe et à l'historique choisis. Le
    serveur agrège leurs entrées, remplace toute entrée générique par le choix concret,
    additionne l'or et ajoute la babiole sans coût.
11. Une armure ou un bouclier porté est possédé. Une option en or seul ne matérialise
    aucun objet promis par le paquetage abandonné.
12. Le score final est recalculé et une composition au-delà de 20 est refusée, jamais
    écrêtée silencieusement.

## Persistance et transaction

La création persiste atomiquement le personnage complet, son auto-attribution lorsque
l'acteur est joueur, le reçu durable, l'audit fonctionnel et le fait d'outbox. Une
erreur de catalogue, quota, appartenance, unicité ou persistance annule tout. Le
personnage porte une révision initiale explicite ; toute mutation ultérieure filtre
sur la révision attendue. Une relecture charge toujours par campagne et identifiant.

Le document persiste les entrées de composition et l'équipement recalculé. La fiche
reste une projection calculée, sans dérivés client persistés.

## Fiche initiale calculée

La fiche expose niveau, PX, bonus de maîtrise, scores/modificateurs, PV max et actuels
initiaux, dé de vie, CA, initiative, vitesse, perception passive, sauvegardes,
18 compétences, maîtrises/expertise, langues, attaques d'armes possédées, magie groupée
par provenance, DD/attaque magique, capacités, ressources, grimoire et équipement.
Les dérivés sont obtenus du même moteur pour l'aperçu et la lecture persistée.

## Projections et isolation

Les lectures complètes restent réservées au joueur assigné et aux MJ actifs. Le vivier
ne reçoit ni identité détaillée, ni caractéristiques, choix, sorts ou équipement. Toute
ressource se charge par campagne ; un identifiant extérieur est masqué comme absent.

## Cas limites Given/When/Then

1. Étant donné chacune des 120 paires espèce–classe et des choix internes valides,
   quand la création est commandée, alors elle produit un personnage niveau 1.
2. Étant donné une langue rare dans le quota de deux langues standards, quand la copie
   est soumise, alors elle est refusée ; une langue de classe séparée ne réduit pas ce
   quota.
3. Étant donné un score final supérieur à 20, quand la copie est soumise, alors aucune
   fiche n'est persistée et aucune valeur n'est écrêtée.
4. Étant donné un sort inconnu, du mauvais niveau, de la mauvaise liste, dupliqué, en
   trop ou manquant, quand la copie est soumise, alors la source fautive est refusée.
5. Étant donné un sort d'Initié à la magie, quand le quota de classe est évalué, alors
   ce sort ne le satisfait pas.
6. Étant donné un Magicien avec quatre préparés dont un absent de son grimoire, quand
   la copie est soumise, alors elle est refusée.
7. Étant donné une invocation de niveau 2+, une forme de familier inconnue, une arme de
   pacte à distance ou un rituel invalide, quand la copie est soumise, alors elle est
   refusée sans effet partiel.
8. Étant donné une botte d'arme sur une arme non maîtrisée par la classe, quand la
   copie est soumise, alors elle est refusée.
9. Étant donné une option d'équipement d'une autre classe, un objet ou de l'or forgé
   par le client, quand la copie est soumise, alors le serveur refuse l'option ou
   recalcule les conséquences sans reprendre les valeurs forgées.
10. Étant donné une armure ou un bouclier non reçu, quand le personnage le déclare
    porté, alors la copie est refusée.
11. Étant donné la même composition avec et sans une babiole valide, quand les deux
    équipements sont calculés, alors l'or est identique et une seule possession
    supplémentaire apparaît.
12. Étant donné une création joueur, quand une écriture de l'enveloppe échoue, alors
    ni personnage, ni attribution, reçu, audit ou outbox ne subsiste.
13. Étant donné une commande acceptée retransmise avec la même clé et intention, quand
    elle est rejouée, alors le résultat initial est relu sans second personnage.
14. Étant donné la même clé avec une intention différente, quand elle est rejouée,
    alors elle répond en conflit sans mutation.
15. Étant donné l'identifiant d'un personnage d'une autre campagne ou un autre joueur,
    quand la fiche ou le build est demandé, alors aucune donnée privée n'est projetée.

## DÉCISION REQUISE — stockage des portraits

La cible fonctionnelle impose un portrait facultatif et un visuel générique, mais 5A,
5B et 5C reportent explicitement stockage, formats et limites. Aucun mécanisme n'est
donc inventé dans cet incrément.

Options à arbitrer :

1. stockage local initial : simple pour une instance, mais sauvegarde, purge et futur
   déploiement multi-instance doivent gérer des fichiers hors MongoDB ;
2. GridFS/MongoDB : transaction et sauvegarde rapprochées, mais base alourdie et
   diffusion HTTP à concevoir ;
3. stockage objet : diffusion et montée en charge adaptées, mais nouveau service,
   secrets, coûts et stratégie transactionnelle à décider.

La décision doit aussi fixer formats, taille maximale, traitement d'image, suppression,
URL/projection et portrait générique exact avant tout champ de téléversement.

## Hors périmètre volontaire

- validation, refus, correction et acceptation par le MJ (`B01-VAL-002` à
  `B01-VAL-005`) ;
- progression au-delà du niveau 1, respécialisation, aventure et combat ;
- magasin, achat, fabrication, commerce et variante de taille d'équipement ;
- téléversement de portrait jusqu'à résolution de la décision ci-dessus ;
- modification des seeds, migrations, `.env` ou CI.

