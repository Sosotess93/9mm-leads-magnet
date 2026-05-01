# Test Consommateur 9MM — Setup Backend (Google Sheet + Apps Script)

Procédure à faire **une seule fois** pour activer la collecte des réponses.
Compte à utiliser : **9mm.questionnaire@gmail.com** (ou n'importe quel compte Google qui aura accès aux données).

## Étape 1 — Créer le Google Sheet

1. Aller sur [sheets.google.com](https://sheets.google.com) → **Nouveau** → **Feuille de calcul vierge**
2. Renommer la feuille : `9MM Test Consommateur`
3. Laisser la feuille vide pour le moment (les en-têtes seront ajoutés automatiquement à l'étape suivante)

## Étape 2 — Coller le script Apps Script

1. Dans le Google Sheet : **Extensions** → **Apps Script**
2. Un éditeur s'ouvre avec un fichier `Code.gs` vierge — supprimer son contenu
3. Coller **tout le contenu** de `docs/test-conso-apps-script.gs` (dans ce dépôt)
4. Renommer le projet en haut : "9MM Test Conso Backend"
5. **Enregistrer** (icône disquette ou Cmd+S)

## Étape 3 — Initialiser les en-têtes

1. Dans l'éditeur Apps Script, sélectionner la fonction `setupHeaders` dans le menu déroulant en haut
2. Cliquer **Exécuter** (▶)
3. Première exécution : Google demande des autorisations
   - Cliquer "Autoriser l'accès"
   - Choisir le compte `9mm.questionnaire@gmail.com`
   - "L'application n'est pas validée" → **Paramètres avancés** → **Accéder à 9MM Test Conso Backend (non sécurisé)**
   - Autoriser tous les accès demandés (Sheets + Mail)
4. Vérifier que le Google Sheet a maintenant une ligne d'en-tête figée avec ~34 colonnes

## Étape 4 — Déployer en Web App

1. Dans l'éditeur Apps Script : **Déployer** → **Nouveau déploiement**
2. Cliquer l'icône engrenage à côté de "Sélectionner le type" → **Application web**
3. Configurer :
   - **Description** : "v1 production"
   - **Exécuter en tant que** : Moi (`9mm.questionnaire@gmail.com`)
   - **Qui a accès** : **Tout le monde** (oui, vraiment — c'est ce qui permet aux navigateurs de poster les réponses)
4. Cliquer **Déployer**
5. **Copier l'URL** affichée. Elle ressemble à :
   `https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec`

## Étape 5 — Tester l'URL

Ouvre l'URL dans ton navigateur. Tu dois voir :
> 9MM Test Consommateur endpoint OK. POST your data here.

Si tu vois ce message, le backend est OK.

## Étape 6 — Connecter les fichiers HTML

Dans `quizz.html`, remplacer la ligne :

```js
const ENDPOINT = 'REPLACE_WITH_GOOGLE_APPS_SCRIPT_URL';
```

Par ton URL réelle :

```js
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbXXXXXXXXXXXX/exec';
```

Puis push sur Vercel et c'est bon.

## Étape 7 — Test end-to-end

1. Ouvre `https://challenge.9mm-energy.com/quizz.html`
2. Remplis le quiz jusqu'au bout
3. Vérifier dans le Google Sheet → une nouvelle ligne doit être apparue
4. Vérifier la boîte mail `9mm.questionnaire@gmail.com` → un email "[9MM Test Conso] Nouvelle réponse..." doit être arrivé

## Notes

- **Limites Google** : ~20 000 requêtes/jour pour le script et 100 emails/jour. Largement suffisant pour un test consommateur.
- **CORS** : Apps Script Web App accepte les POST cross-origin sans config spéciale, ça marche tel quel depuis le domaine 9mm-energy.com.
- **Modifier le script** : si tu changes le script, il faut **redéployer** (Déployer → Gérer les déploiements → ✏️ → Nouvelle version) — sinon l'URL pointe vers l'ancienne version.
- **Lire les réponses** : tout est dans le Google Sheet, tu peux filtrer/trier/exporter en CSV.
- **Backup local** : en cas d'échec réseau côté client, les données sont stockées dans le `localStorage` du navigateur sous la clé `9mm_test_conso_pending`.
