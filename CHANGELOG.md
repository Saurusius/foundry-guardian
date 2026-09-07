# Changelog

## 1.1.5
- Correction robuste du bouton « Gestion des utilisateurs ».
- Le clic est désormais intercepté globalement en phase capture et appelle directement l’API `openUsers()`.
- Renforcement CSS du bouton (`pointer-events`, curseur, z-index).

## 1.1.4
- Ajoute une entrée native **Gestion des utilisateurs** dans les paramètres du module Foundry Guardian.
- Ajoute automatiquement une macro **Foundry Guardian — Utilisateurs** qui ouvre directement le gestionnaire de comptes.
- L'accès au gestionnaire ne dépend donc plus du bouton interne du panneau Guardian.

## 1.1.1
- Correction du bouton « Gestion des utilisateurs » avec les actions natives ApplicationV2 de Foundry v14.
- Les actions créer / modifier / supprimer utilisent désormais elles aussi le gestionnaire `data-action` natif de Foundry.
- Création automatique d'une macro « Foundry Guardian » pour les administrateurs Guardian, sans doublon.
- La macro ouvre directement la configuration Guardian.

## 1.1.0

- Ajout d'un gestionnaire d'utilisateurs intégré à Foundry Guardian.
- Création de profils avec rôle et mot de passe.
- Modification du nom, du rôle et du mot de passe.
- Suppression sécurisée des utilisateurs.
- Protection contre la suppression/rétrogradation du dernier Game Master.
- Confirmation avant promotion en Game Master.
- Accès réservé aux administrateurs Guardian.

## 1.1.2
- Corrige le bouton « Gestion des utilisateurs » avec un listener DOM explicite compatible avec le rendu du menu de réglages Foundry v14.
- Sécurise également les actions Créer, Enregistrer et Supprimer du gestionnaire d'utilisateurs avec des listeners directs.
