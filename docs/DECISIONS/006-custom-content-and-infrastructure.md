# DEC-006 — Contenu personnalisé et infrastructure MVP

- **Statut :** validée
- **Contexte :** la campagne d'octobre a besoin d'objets propres au scénario, mais pas
  encore d'une plateforme extensible à tous les contenus et systèmes.

## Décision

Les MJ peuvent créer des objets personnalisés limités à leur campagne. Leurs effets sont
structurés et automatisables ou explicitement manuels, sans code arbitraire. Les
modifications mécaniques produisent une nouvelle version ; l'archivage préserve les
exemplaires déjà détenus.

La création personnalisée de monstres, sorts, capacités, classes et espèces ainsi que
l'import entre campagnes sont reportés. Les invitations dans l'application restent la
source d'autorité et sont doublées par un courriel dont l'échec n'annule pas
l'invitation.

Redis est abandonné pour le MVP monolithique : aucun besoin actuel ne justifie son coût
opérationnel. Il ne sera réintroduit que pour un besoin concret, par exemple plusieurs
instances, cache mesuré, file de travaux ou coordination distribuée.

Socket.IO répond au besoin temps réel, sur une seule instance NestJS initiale et sans
adaptateur Redis. Son ajout comme dépendance et son protocole détaillé restent soumis à
une décision technique explicite avant le code.
