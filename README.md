# 🛡️ Foundry Guardian 1.2.0

**Foundry Guardian** protège les réglages sensibles de Foundry VTT et permet de choisir quels Game Masters conservent les accès administratifs importants.

Le module est pensé pour les mondes communautaires et les tables avec plusieurs MJ : chacun peut continuer à maîtriser normalement, tandis que les fonctions sensibles restent réservées aux administrateurs Guardian autorisés.

## ✨ Nouveauté 1.2.0 — Gestion intégrée des utilisateurs

La gestion des utilisateurs est désormais directement intégrée dans le panneau principal de Foundry Guardian.

Depuis :

**Configuration des paramètres → Foundry Guardian → Gérer les accès**

un administrateur Guardian peut :

- créer un profil utilisateur ;
- définir son nom ;
- choisir son rôle Foundry ;
- définir un mot de passe ;
- modifier un utilisateur existant ;
- changer son rôle ;
- changer son mot de passe ;
- supprimer un utilisateur.

### Rôles disponibles

Guardian utilise les rôles natifs de Foundry VTT :

- Bloqué
- Joueur
- Joueur de confiance
- Assistant MJ
- Game Master

## 🔒 Protections Guardian

Foundry Guardian peut empêcher les MJ non autorisés de modifier :

- les réglages généraux de Foundry ;
- les paramètres du système de jeu ;
- les paramètres des modules ;
- les modules actifs ;
- les comptes utilisateurs ;
- les rôles et permissions ;
- les réglages du monde ;
- le retour à l'administration de Foundry.

Les commandes protégées sont masquées pour les MJ non autorisés et Guardian dispose également d'un garde-fou lorsqu'une interface protégée est ouverte directement.

## 🛡️ Garde-fous utilisateurs

La gestion des comptes possède plusieurs protections :

- seuls les administrateurs Guardian autorisés peuvent gérer les utilisateurs ;
- impossible de supprimer son propre compte depuis Guardian ;
- impossible de supprimer le dernier Game Master ;
- impossible de rétrograder le dernier Game Master ;
- une promotion au rôle Game Master demande une confirmation ;
- les mots de passe existants ne sont jamais affichés ;
- la confirmation du mot de passe évite les erreurs lors de la création d'un compte.

## 👑 Administrateurs Guardian

Guardian distingue le rôle natif Foundry du statut d'administrateur Guardian.

Un utilisateur peut donc être **Game Master** dans Foundry sans nécessairement avoir accès aux fonctions administratives protégées par Guardian.

Lors de la première configuration, tant qu'aucun administrateur Guardian n'a été défini, les Game Masters peuvent accéder au panneau afin d'éviter tout verrouillage accidentel.

Il doit ensuite toujours rester au moins un administrateur Guardian autorisé.

## 🧙 Macro de lancement

Pour ouvrir directement Foundry Guardian depuis une macro Script :

Cette macro peut être placée dans la hotbar pour accéder rapidement à la gestion du module.

📦 Installation
Installation via le manifest

Dans :

Configuration et administration → Modules complémentaires → Installer un module

utilisez :

https://github.com/Saurusius/foundry-guardian/releases/latest/download/module.json
Installation manuelle

Téléchargez :

foundry-guardian-v1.2.0.zip

depuis la dernière release GitHub.

Extrayez ensuite le dossier :

foundry-guardian

dans :

<Foundry Data>/modules/

Redémarrez Foundry VTT puis activez Foundry Guardian dans votre monde.

⚙️ Compatibilité
Foundry VTT minimum : 14
Version vérifiée : 14.366
Système de jeu : indépendant
⚠️ Limite de sécurité

Foundry Guardian est avant tout conçu pour séparer les responsabilités administratives et empêcher les erreurs ou manipulations accidentelles.

Un véritable compte Game Master reste très puissant selon le système de permissions natif de Foundry VTT.

Guardian complète donc les permissions Foundry mais ne remplace pas leur modèle de sécurité.

🔧 API

Une petite API est disponible pour les macros, le diagnostic et les intégrations :

game.modules.get("foundry-guardian").api.isAuthorized();
game.modules.get("foundry-guardian").api.getAdminIds();
game.modules.get("foundry-guardian").api.getProtections();
game.modules.get("foundry-guardian").api.openConfig();
📜 Version

Version actuelle : 1.2.0

Voir CHANGELOG.md pour l'historique des versions.

Développé pour Foundry VTT par Saurusius.
```js
game.modules.get("foundry-guardian")?.api?.openConfig();
