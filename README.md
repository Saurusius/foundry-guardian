# Foundry Guardian

**Foundry Guardian** permet de réserver les réglages sensibles de Foundry VTT à certains comptes Game Master explicitement autorisés.

Il est pensé pour les mondes communautaires ou les tables disposant de plusieurs MJ : les MJ peuvent continuer à maîtriser normalement, tandis que les réglages administratifs importants restent réservés aux profils choisis.

## Fonctionnalités

- Sélection des MJ autorisés à administrer Foundry.
- Recherche rapide dans la liste des MJ.
- Liste des MJ défilable pour les grandes communautés.
- Fenêtre de configuration entièrement défilable.
- Protection indépendante de plusieurs catégories d'administration.
- Disparition des commandes protégées pour les MJ non autorisés.
- Blocage de secours si une fenêtre protégée est ouverte directement.
- Protection anti-lockout lors de la première configuration.

## Protections disponibles

Foundry Guardian peut empêcher les autres MJ de modifier :

- les réglages de Foundry, du système et des modules ;
- la liste des modules actifs ;
- les comptes, rôles et permissions ;
- les réglages du monde ;
- le retour à l'administration de Foundry.

## Compatibilité

- **Foundry VTT :** minimum 14
- **Version vérifiée :** 14.365
- **Système :** indépendant du système de jeu

## Installation via le manifest

Dans **Configuration et administration → Modules complémentaires → Installer un module**, utilisez :

```text
https://github.com/Saurusius/foundry-guardian/releases/latest/download/module.json
```

Foundry pourra ensuite détecter automatiquement les futures mises à jour du module.

## Installation manuelle

Téléchargez `foundry-guardian-v1.0.0.zip` depuis la release GitHub puis installez le dossier `foundry-guardian` dans :

```text
<Foundry Data>/modules/
```

Redémarrez ensuite Foundry VTT et activez **Foundry Guardian** dans votre monde.

## Première configuration

1. Connectez-vous avec un compte Game Master.
2. Ouvrez les réglages de Foundry.
3. Dans **Foundry Guardian**, cliquez sur **Gérer les accès**.
4. Ouvrez **Choisir les MJ autorisés**.
5. Sélectionnez au moins un administrateur.
6. Choisissez les fonctions que les autres MJ ne peuvent pas modifier.
7. Cliquez sur **Enregistrer les accès**.

Tant qu'aucun administrateur n'a été enregistré, tous les comptes Game Master peuvent initialiser le module. Cela évite de verrouiller accidentellement l'administration du monde lors de la première activation.

## Important : limite de sécurité

Foundry Guardian agit principalement côté client. Il est conçu pour séparer les responsabilités et empêcher les erreurs ou manipulations accidentelles.

Un utilisateur possédant réellement le rôle **Game Master** reste un utilisateur très privilégié selon le modèle de permissions natif de Foundry VTT. Pour une séparation de sécurité forte face à un utilisateur volontairement malveillant, utilisez également les rôles et permissions natifs de Foundry.

## API

Une petite API est exposée pour le diagnostic et les intégrations :

```js
game.modules.get("foundry-guardian").api.isAuthorized();
game.modules.get("foundry-guardian").api.getAdminIds();
game.modules.get("foundry-guardian").api.getProtections();
game.modules.get("foundry-guardian").api.openConfig();
```

## Version

Version actuelle : **1.0.0**

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.
