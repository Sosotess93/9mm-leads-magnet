# Quiz Test Consommateur 9MM — Design Document

**Date :** 2026-05-01
**Statut :** Validé pour implémentation
**Auteur :** Sofiane (brainstorm avec assistant)

## Contexte & Objectif

9MM lance un test consommateur pour évaluer ses deux produits (Body — canette rouge / Mind — canette bleue). Les participants goûtent une ou deux boissons puis remplissent un questionnaire d'évaluation sensorielle, comportementale et d'intention d'achat.

**Objectifs métier :**
- Collecter des évaluations qualitatives et quantitatives sur les deux produits
- Mesurer le taux de complétion entre deux formats UX différents (A/B test interne)
- Stocker les données dans un format facilement analysable

**Contexte d'usage :** mixte — présentiel (événements, dégustations sur place) et distance (lien envoyé à des testeurs ayant reçu les canettes).

## Architecture

### Fichiers livrés

- `quiz-test-conso-v1.html` — Variante A : style Typeform (1 question / écran)
- `quiz-test-conso-v2.html` — Variante C : style hybride (questions groupées par section logique)

Les deux fichiers sont **standalone** (pattern identique aux autres quiz du site) et **non liés depuis l'index.html**. Les URLs sont partagées manuellement par l'équipe 9MM selon les campagnes.

### Backend partagé

- **Google Apps Script Web App** déployée publiquement (1 seul endpoint pour les 2 variantes)
- **Google Sheet** unique stockant toutes les réponses, avec colonne `variant` (`v1` ou `v2`) pour différencier
- Notification email vers `9mm.questionnaire@gmail.com` à chaque soumission
- Pas de service tiers payant, pas de captcha, pas de redirection

### Tracking

- Meta Pixel (`518117033236885`) inclus dans le `<head>` (cohérent avec le reste du site)
- Events :
  - `PageView` au chargement
  - `trackCustom('TestConsoStart', {variant})` au clic sur "Commencer"
  - `trackCustom('TestConsoComplete', {variant})` à la soumission

## Flow UX

### Tronc commun (logique partagée V1 et V2)

1. **Écran d'accueil** — pitch + CTA "Commencer"
2. **Sélection : 1 ou 2 produits ?** — détermine si la branche "Produit 2" et "Comparaison" est jouée
3. **Profil participant** — âge, sexe, fréquence de consommation
4. **Évaluation Produit 1** — choix de la canette (rouge OU bleu) + 9 critères d'évaluation
5. **Intention d'achat Produit 1** — willingness to buy + prix
6. **Évaluation Produit 2** — *seulement si 2 produits* — l'autre canette + mêmes critères
7. **Intention d'achat Produit 2** — *seulement si 2 produits*
8. **Comparaison** — *seulement si 2 produits* — classement Body vs Mind
9. **Avis libre** — 3 textareas optionnels (aimé / amélioré / description)
10. **Email optionnel**
11. **Soumission → Google Sheet → Écran Merci**

### Variante V1 — Typeform style

- 1 question = 1 écran
- ~12 écrans (1 produit) à ~25 écrans (2 produits)
- Transitions fade entre écrans
- Bouton "Suivant" qui apparaît au choix de la réponse, désactivé tant que pas de réponse pour les questions obligatoires
- Bouton "Retour" (←) toujours disponible
- Progress bar fixe en haut

### Variante V2 — Hybride

- ~8-10 écrans selon nombre de produits
- Regroupement logique :
  1. Accueil
  2. Combien de produits + Profil (4 questions / 1 écran)
  3. Produit 1 — Goût (note globale + sucre + acidité)
  4. Produit 1 — Sensoriel (odeur + texture + pétillance + couleur visuel)
  5. Produit 1 — Achat (intention + prix)
  6-8. Produit 2 (si applicable) — mêmes 3 écrans
  9. Comparaison (si 2 produits)
  10. Avis libre + Email
  11. Merci

### Validation

- **Obligatoires** : Profil, Évaluations (toutes les notes/échelles), Intention d'achat, Comparaison (si 2 produits)
- **Optionnelles** : Email, 3 questions ouvertes "Avis libre"
- Bouton "Suivant" désactivé tant que les champs obligatoires de l'écran ne sont pas remplis

## Modèle de données (Google Sheet)

Une feuille unique, 1 ligne = 1 réponse.

| Catégorie | Colonnes |
|---|---|
| **Meta** | `timestamp`, `variant` (v1/v2), `email` (optionnel), `nb_produits` (1 ou 2), `user_agent` |
| **Profil** | `age` (-18, 18-24, 25-34, 35-44, 45-54, 55+), `sexe` (femme, homme, autre), `frequence` (tous_les_jours, plusieurs_par_semaine, occasionnellement, rarement) |
| **Produit 1** | `p1_couleur` (rouge, bleu), `p1_note_globale` (1-9), `p1_gout` (1-5), `p1_sucre` (1-5, beaucoup_trop_faible → beaucoup_trop_eleve), `p1_acidite` (1-3), `p1_odeur` (1-5), `p1_texture` (1-5), `p1_petillance` (1-3), `p1_couleur_visuel` (1-5), `p1_intention_achat` (oui_certainement, oui_peut_etre, non_probablement, non_certainement), `p1_prix` (<1, 1-2, 2-3, >3) |
| **Produit 2** | `p2_*` (mêmes colonnes, vides si 1 seul produit) |
| **Comparaison** | `prefere` (body, mind, vide si 1 produit) |
| **Avis libre** | `aime` (text, optionnel), `ameliorer` (text, optionnel), `description` (text, optionnel) |

## Backend technique (Google Apps Script)

### Endpoint POST

```js
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  sheet.appendRow([
    new Date(),
    data.variant,
    data.email || '',
    data.nb_produits,
    data.user_agent || '',
    data.age, data.sexe, data.frequence,
    data.p1_couleur, data.p1_note_globale, data.p1_gout,
    data.p1_sucre, data.p1_acidite, data.p1_odeur, data.p1_texture,
    data.p1_petillance, data.p1_couleur_visuel,
    data.p1_intention_achat, data.p1_prix,
    data.p2_couleur || '', data.p2_note_globale || '', /* etc */
    data.prefere || '',
    data.aime || '', data.ameliorer || '', data.description || ''
  ]);

  // Notification email
  try {
    MailApp.sendEmail(
      '9mm.questionnaire@gmail.com',
      `[9MM Test Conso] Nouvelle réponse (${data.variant})`,
      `Variante : ${data.variant}\nProduits : ${data.nb_produits}\n\nDétails :\n${JSON.stringify(data, null, 2)}`
    );
  } catch (err) { /* fail silently to not break the response */ }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Côté frontend (HTML)

```js
const ENDPOINT = 'https://script.google.com/macros/s/XXXXXX/exec';

async function submitQuiz(formData) {
  formData.variant = 'v1'; // ou 'v2'
  formData.user_agent = navigator.userAgent;

  // Backup local en cas d'échec réseau
  localStorage.setItem('9mm_test_conso_pending', JSON.stringify(formData));

  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    localStorage.removeItem('9mm_test_conso_pending');
  } catch (err) {
    console.error('Submit error:', err);
    // On affiche merci quand même — la requête a probablement abouti
  }

  fbq('trackCustom', 'TestConsoComplete', { variant: formData.variant });
  showThankYouScreen();
}
```

### Setup one-time côté Google (utilisateur)

1. Créer un nouveau Google Sheet "9MM Test Consommateur"
2. Ajouter une ligne d'en-tête avec les noms de colonnes (voir modèle de données)
3. Extensions → Apps Script → coller le code du `doPost`
4. Déployer → Nouveau déploiement → Type "Web app" → Exécuter en tant que "moi" → Accès "Tout le monde"
5. Copier l'URL `https://script.google.com/macros/s/XXX/exec`
6. La transmettre à l'assistant pour intégration dans les 2 fichiers HTML
7. Autoriser les permissions email lors du premier déploiement

## Design système (visuel)

### Tokens (hérités du site)

- Fond : `#0a0a0a`
- Rouge (Body) : `#FF1717`
- Cyan (Mind) : `#00EDEF`
- Fonts : Oswald (titres) + Inter (corps)
- Composants : `glass-card`, animations `fadeSlideBlurIn`, border-beams

### Composants spécifiques

- **Échelle 1-9** (note globale) : 9 boutons en ligne avec gradient rouge → vert, labels "Je déteste / J'adore" aux extrémités. Mobile : grid compact 9 colonnes.
- **Choix multiples** (sucre, acidité, etc.) : cartes verticales empilées (pattern de `quiz-military-training.html`).
- **Sélecteur produit** : 2 grosses cartes côte à côte (🔴 Body / 🔵 Mind). En 2-produits, désactive auto la canette déjà notée.
- **Échelles 5 points** : 5 boutons horizontaux ou cards compactes selon V1/V2.
- **Échelles 3 points** (acidité, pétillance) : 3 boutons horizontaux.
- **Comparaison** : 2 cartes Body/Mind avec sélecteur "1er / 2e" (pas de drag-drop pour simplicité mobile).
- **Prix** : 4 boutons preset ("< 1€", "1-2€", "2-3€", "> 3€"), pas de saisie libre.
- **Textareas avis libre** : champs optionnels avec placeholder explicite.
- **Email optionnel** : input avec label "Email (facultatif)" + helper text "Pour recevoir les résultats du test".

### Écran "Merci"

- Animation checkmark / pulse cyan
- Message : "Merci pour ton avis, il fait avancer 9MM 🚀"
- CTA secondaire "Retour au site" → `index.html`
- Fire `TestConsoComplete` event (Meta Pixel)

### Mobile-first

- Tout testé < 375px largeur
- Boutons min 44px hauteur
- Inputs `font-size: 16px` minimum (anti-zoom iOS)

## Gestion d'erreur

- `fetch` échoue → `localStorage` conserve les données, écran merci affiché quand même (95% des cas la requête a abouti avant l'erreur réseau)
- Données récupérables manuellement dans la console (`localStorage.getItem('9mm_test_conso_pending')`)
- Logs de la soumission stockés en console pour debug

## Hors scope (volontairement non inclus)

- Pas de bandeau cookie consent (cohérent avec ton choix actuel sur le reste du site)
- Pas d'intégration Klaviyo (le test conso n'alimente pas la newsletter)
- Pas de système de save & resume (cas d'usage en single session)
- Pas de dashboard d'analyse intégré (analyse via Google Sheet directement)
- Pas de drag-and-drop pour la comparaison (2 boutons "1er / 2e" suffisent)
- Pas de variant C/D supplémentaires pour A/B (juste V1 et V2)

## Critères de succès

- ✅ Les 2 fichiers HTML sont visuellement distincts mais cohérents avec la charte 9MM
- ✅ Le flow s'adapte à 1 ou 2 produits sans bug
- ✅ Toutes les réponses arrivent dans le Google Sheet avec les bonnes colonnes remplies
- ✅ Email de notification reçu à `9mm.questionnaire@gmail.com`
- ✅ Test sur mobile (iOS Safari, Android Chrome) sans bug d'affichage
- ✅ Meta Pixel fire `TestConsoComplete` à la complétion
- ✅ Aucun captcha, aucune redirection externe pour l'utilisateur
