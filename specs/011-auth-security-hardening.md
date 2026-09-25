# Spec 011 — Durcissement de la session et de l'inscription

## Statut

**VALIDÉE par instruction du propriétaire le 25 septembre 2026.** Cette tranche
ferme `SEC-01` et `SEC-02` de l'audit qualité back.

## Origine du lien de vérification

Le client continue d'envoyer `appOrigin` pour permettre les usages local, LAN et
tunnel. Cette valeur n'est jamais une autorité : après normalisation par l'origine
URL (`protocole + hôte + port`), elle doit correspondre exactement à une entrée de
`CORS_ORIGINS`. Toute autre origine est refusée avant la création du compte et avant
l'émission d'un jeton.

Critères d'acceptation :

1. une origine configurée produit le lien de vérification attendu ;
2. chemin, query et slash final sont retirés par la normalisation ;
3. une origine extérieure est refusée sans compte, jeton ni courriel créé ;
4. les entrées de `CORS_ORIGINS` sont elles-mêmes des URL valides.

## Rotation atomique du refresh token

Une rotation révoque conditionnellement le token présenté et insère son successeur
dans une même transaction MongoDB. La révocation ne réussit que si le token n'était
pas déjà révoqué. Une seule rotation concurrente peut donc gagner ; la perdante rend
le conflit de course existant sans créer de second successeur.

La transaction est retenue conformément à `DEC-015`. Conséquence : le déploiement
MongoDB doit supporter les transactions. Aucune nouvelle dépendance n'est ajoutée.

Critères d'acceptation :

1. consommation et insertion sont toutes deux annulées si la transaction échoue ;
2. deux rotations concurrentes ne créent qu'un successeur actif ;
3. la perdante rend `RefreshRaceError` et ne révoque pas la lignée ;
4. la détection d'une réutilisation hors fenêtre continue de révoquer la lignée.

## Hors périmètre

- reprise d'une vérification d'email interrompue (`COR-02`) ;
- changement des durées de session ou de la fenêtre de grâce ;
- modification de `.env`, du CI ou de la topologie MongoDB.
