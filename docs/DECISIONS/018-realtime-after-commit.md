# DEC-018 — Diffusion temps réel après commit

- **Statut :** validée
- **Date de validation :** 28 août 2026
- **Phase :** 5D
- **Détail :** [contrat temps réel](../TECHNICAL-REALTIME-5D.md)

## Problème

Les invitations et amitiés reçues n'actualisent pas le front sans rechargement. Les
combats et le butin demanderont également une diffusion interactive, sans transformer
une connexion persistante en source de vérité ou en frontière d'autorisation.

## Décision

1. Ajouter Socket.IO au monolithe NestJS mono-instance, sans Redis.
2. Conserver toutes les commandes métier en HTTP pour la première tranche.
3. Diffuser uniquement après commit depuis une outbox livrée au moins une fois.
4. Séparer le périmètre métier de l'audience de diffusion ; `campaignId` reste absent
   de toute amitié.
5. Fermer le vocabulaire d'audience dans le kernel et mettre en quarantaine terminale
   toute politique inconnue.
6. Recalculer à chaque émission les destinataires dépendant d'un rôle ou d'une
   adhésion ; conserver dans l'enveloppe les deux participants immuables nécessaires
   à la suppression d'une amitié, puis cibler les rooms `user:{userId}`.
7. Exposer au navigateur une notification minimale avec identité stable, validée dans
   `shared`, afin qu'il déduplique et invalide TanStack Query.
8. Vérifier l'origine et le JWT au handshake, déconnecter à l'expiration du JWT et au
   logout, et n'accepter aucune commande métier entrante dans cette tranche.

## Conséquences

- Une room facilite l'acheminement sans accorder de droit.
- Une exclusion prend effet à l'émission suivante par relecture de l'audience.
- Les doublons ne rejouent aucune mutation et sont dédupliqués par `messageId` côté
  client.
- Une erreur de vocabulaire ne peut jamais élargir l'audience.
- Socket.IO et son client deviennent des dépendances explicites du MVP.
- La révocation immédiate d'un JWT d'accès déjà copié reste distincte de la fermeture
  des sockets présentes et nécessite une décision ultérieure.

## Validation

Le propriétaire a demandé le 28 août 2026 d'appliquer les recommandations consolidées
et de lancer la modification.
