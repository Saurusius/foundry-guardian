# Foundry Guardian 1.1.0

Foundry Guardian protège les réglages sensibles de Foundry VTT et permet de choisir quels MJ restent administrateurs Guardian.

## Nouveauté 1.1.0 — Gestion des utilisateurs

Depuis **Configuration des paramètres > Foundry Guardian > Gérer les accès**, un administrateur Guardian peut ouvrir **Gestion des utilisateurs** et :

- créer un utilisateur ;
- choisir son rôle Foundry (Bloqué, Joueur, Joueur de confiance, Assistant MJ, Game Master) ;
- définir un mot de passe ;
- modifier le nom, le rôle ou le mot de passe ;
- supprimer un utilisateur.

### Garde-fous

- seuls les administrateurs Guardian autorisés ont accès au gestionnaire ;
- impossible de supprimer son propre compte depuis Guardian ;
- impossible de supprimer ou rétrograder le dernier Game Master ;
- une promotion Game Master demande confirmation ;
- les mots de passe existants ne sont jamais affichés.

Compatible Foundry VTT v14.


## Macro de lancement
À partir de la v1.1.1, Guardian crée automatiquement une macro **Foundry Guardian** pour les administrateurs autorisés. Elle ouvre directement le panneau principal.

Commande équivalente à coller manuellement dans une macro Script :
```js
game.modules.get("foundry-guardian")?.api?.openConfig();
```

Pour ouvrir directement les utilisateurs :
```js
game.modules.get("foundry-guardian")?.api?.openUsers();
```
