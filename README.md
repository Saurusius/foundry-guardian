# 🛡️ Foundry Guardian

**Foundry Guardian** est un module de protection administrative pour **Foundry Virtual Tabletop V14**, conçu pour les mondes communautaires et les tables utilisant plusieurs Game Masters.

Il permet de choisir quels MJ conservent l’accès aux fonctions administratives sensibles de Foundry, tout en laissant les autres Game Masters maîtriser normalement leurs parties.

## ✨ Fonctionnalités

* Protection des réglages sensibles de Foundry VTT.
* Séparation entre le rôle **Game Master** et le statut **Administrateur Guardian**.
* Gestion des administrateurs autorisés.
* Gestion intégrée des comptes utilisateurs.
* Création, modification et suppression d’utilisateurs.
* Modification des rôles Foundry.
* Modification sécurisée des mots de passe.
* Protection du dernier Game Master.
* Masquage des commandes administratives pour les MJ non autorisés.
* Blocage des interfaces protégées ouvertes directement.
* Macro de lancement rapide.
* API simple pour les macros et intégrations.
* Compatible avec tous les systèmes de jeu.

## 🔒 Protections Guardian

Foundry Guardian peut empêcher les Game Masters non autorisés de modifier ou d’utiliser certaines fonctions sensibles.

Selon la configuration du module, Guardian peut protéger :

* les réglages généraux de Foundry ;
* les paramètres du système de jeu ;
* les paramètres des modules ;
* les modules actifs ;
* les comptes utilisateurs ;
* les rôles et permissions ;
* les réglages du monde ;
* le retour à l’administration de Foundry.

Les commandes protégées sont masquées pour les MJ non autorisés.

Guardian applique également un garde-fou lorsqu’une interface protégée est ouverte directement afin d’éviter qu’un simple accès par URL, macro ou autre moyen contourne les restrictions.

## 👑 Administrateurs Guardian

Guardian distingue volontairement deux notions :

**Game Master Foundry**

et

**Administrateur Guardian**

Un utilisateur peut donc être **Game Master** dans Foundry sans nécessairement disposer des accès administratifs protégés par Guardian.

Les administrateurs Guardian sont les utilisateurs autorisés à modifier la configuration du module et à accéder aux fonctions sensibles protégées.

Lors de la première configuration, tant qu’aucun administrateur Guardian n’a encore été défini, les Game Masters peuvent accéder au panneau afin d’éviter tout verrouillage accidentel.

Une fois Guardian configuré, il doit toujours rester au moins un administrateur autorisé.

## 👥 Gestion des utilisateurs

Depuis la version **1.2.0**, Foundry Guardian intègre directement un gestionnaire de comptes utilisateurs.

Il est accessible depuis :

**Configuration des paramètres → Foundry Guardian → Gérer les accès**

Un administrateur Guardian peut :

* créer un utilisateur ;
* définir son nom ;
* choisir son rôle Foundry ;
* définir son mot de passe ;
* modifier un utilisateur existant ;
* changer son rôle ;
* changer son mot de passe ;
* supprimer un utilisateur.

### Rôles disponibles

Guardian utilise directement les rôles natifs de Foundry VTT :

* Bloqué ;
* Joueur ;
* Joueur de confiance ;
* Assistant MJ ;
* Game Master.

## 🛡️ Sécurité des comptes

La gestion des utilisateurs possède plusieurs protections destinées à éviter les erreurs administratives.

* Seuls les administrateurs Guardian peuvent gérer les utilisateurs.
* Un administrateur ne peut pas supprimer son propre compte depuis Guardian.
* Le dernier Game Master du monde ne peut pas être supprimé.
* Le dernier Game Master ne peut pas être rétrogradé.
* Une promotion au rôle Game Master demande confirmation.
* Les mots de passe existants ne sont jamais affichés.
* La confirmation du mot de passe limite les erreurs lors de la création d’un compte.

## 🧙 Macro de lancement

Foundry Guardian expose une petite API permettant notamment d’ouvrir directement ses interfaces depuis une macro.

Pour ouvrir la configuration principale :

```javascript
game.modules.get("foundry-guardian")?.api?.openConfig();
```

Cette macro peut être placée dans la hotbar afin d’accéder rapidement à Guardian.

Une macro dédiée à la gestion des utilisateurs peut également être utilisée lorsque cette fonction est disponible dans la version installée.

## 🔧 API

Foundry Guardian expose une API simple pour les macros, le diagnostic et les intégrations avec d’autres modules.

```javascript
game.modules.get("foundry-guardian")?.api?.isAuthorized();
game.modules.get("foundry-guardian")?.api?.getAdminIds();
game.modules.get("foundry-guardian")?.api?.getProtections();
game.modules.get("foundry-guardian")?.api?.openConfig();
```

### `isAuthorized()`

Indique si l’utilisateur actuellement connecté possède les droits administrateur Guardian.

### `getAdminIds()`

Retourne la liste des identifiants des administrateurs Guardian configurés.

### `getProtections()`

Retourne la configuration actuelle des protections Guardian.

### `openConfig()`

Ouvre directement l’interface principale de configuration de Foundry Guardian.

## 📦 Installation

### Installation par manifest

Dans Foundry VTT :

1. Ouvrez **Configuration et installation**.
2. Allez dans **Modules complémentaires**.
3. Cliquez sur **Installer un module**.
4. Collez l’URL suivante :

```text
https://raw.githubusercontent.com/Saurusius/foundry-guardian/main/module.json
```

Foundry téléchargera automatiquement la dernière version disponible.

### Installation manuelle

Téléchargez le ZIP de la dernière Release GitHub :

```text
foundry-guardian-v1.2.0.zip
```

Extrayez son contenu dans :

```text
FoundryVTT/Data/modules/foundry-guardian/
```

Puis relancez Foundry VTT et activez **Foundry Guardian** dans votre monde.

## 🔄 Mises à jour

Foundry Guardian utilise les Releases GitHub pour les mises à jour.

Le manifest stable est disponible via :

```text
https://github.com/Saurusius/foundry-guardian/releases/latest/download/module.json
```

Lorsqu’une nouvelle version est publiée, Foundry peut automatiquement détecter et installer la mise à jour.

## 🧩 Compatibilité

* **Foundry Virtual Tabletop : V14+**
* Version minimum : **Foundry VTT 14**
* Version vérifiée : **Foundry VTT 14.366**
* Système de jeu : **indépendant**
* Version actuelle de Foundry Guardian : **1.2.0**

## ⚠️ Limite de sécurité

Foundry Guardian est principalement conçu pour **séparer les responsabilités administratives** et empêcher les erreurs ou manipulations accidentelles sur les mondes utilisant plusieurs Game Masters.

Un véritable compte Game Master reste très puissant selon le système de permissions natif de Foundry VTT.

Guardian complète donc les permissions de Foundry mais ne remplace pas son modèle de sécurité natif.

Il ne doit pas être considéré comme une solution d’isolation de sécurité face à un utilisateur disposant volontairement d’un accès complet au serveur ou aux fichiers Foundry.

## 📜 Changelog

### 1.2.0 — Gestion intégrée des utilisateurs

* Intégration de la gestion des utilisateurs dans Foundry Guardian.
* Création de comptes utilisateurs.
* Modification du nom, du rôle et du mot de passe.
* Suppression sécurisée des utilisateurs.
* Protection du dernier Game Master.
* Confirmation avant promotion au rôle Game Master.
* Accès réservé aux administrateurs Guardian.
* Amélioration de l’accès au gestionnaire depuis les paramètres du module.
* Support des macros de lancement rapide.

### 1.1.x — Gestion des utilisateurs

* Première intégration du gestionnaire d’utilisateurs.
* Ajout d’une entrée dédiée dans les paramètres Foundry.
* Ajout de macros d’accès rapide.
* Corrections successives de compatibilité avec les interfaces ApplicationV2 de Foundry V14.
* Renforcement de la fiabilité des boutons et actions du gestionnaire.

### 1.0.0 — Première version publique

* Protection des paramètres sensibles.
* Gestion des administrateurs Guardian.
* Restriction des fonctions administratives pour les Game Masters non autorisés.
* Protection contre l’ouverture directe des interfaces sensibles.
* API destinée aux macros et intégrations.

Le changelog complet est disponible dans [`CHANGELOG.md`](CHANGELOG.md).

---

Développé pour **Foundry Virtual Tabletop** par **Saurusius**. 🛡️
