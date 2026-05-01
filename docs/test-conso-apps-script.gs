/**
 * 9MM — Test Consommateur — Google Apps Script
 *
 * Backend pour les pages quiz-test-conso-v1.html et quiz-test-conso-v2.html.
 * Reçoit les réponses, ajoute une ligne dans la feuille active,
 * envoie une notif email à 9mm.questionnaire@gmail.com.
 *
 * SETUP (une seule fois) :
 * 1. Créer un Google Sheet vierge "9MM Test Consommateur"
 * 2. Coller la ligne d'en-tête (cf. fonction setupHeaders ci-dessous,
 *    ou exécuter setupHeaders() une fois depuis l'éditeur Apps Script)
 * 3. Extensions → Apps Script → coller TOUT ce fichier
 * 4. Déployer → Nouveau déploiement → Type "Application web"
 *    - Exécuter en tant que : Moi
 *    - Qui a accès : Tout le monde
 * 5. Copier l'URL fournie (https://script.google.com/macros/s/XXXXX/exec)
 * 6. La coller dans la const ENDPOINT des 2 fichiers HTML
 */

const NOTIFICATION_EMAIL = '9mm.questionnaire@gmail.com';

const HEADERS = [
  'timestamp','variant','email','nb_produits','user_agent',
  'age','sexe','frequence',
  'p1_couleur','p1_note_globale','p1_gout','p1_sucre','p1_acidite',
  'p1_odeur','p1_texture','p1_petillance','p1_couleur_visuel',
  'p1_intention_achat','p1_prix',
  'p2_couleur','p2_note_globale','p2_gout','p2_sucre','p2_acidite',
  'p2_odeur','p2_texture','p2_petillance','p2_couleur_visuel',
  'p2_intention_achat','p2_prix',
  'prefere','aime','ameliorer','description'
];

/**
 * À exécuter UNE FOIS depuis l'éditeur Apps Script pour créer la ligne d'en-tête.
 * (Tu peux aussi simplement coller HEADERS dans la première ligne du Sheet à la main.)
 */
function setupHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.clear();
  sheet.appendRow(HEADERS);
  sheet.getRange(1, 1, 1, HEADERS.length)
    .setFontWeight('bold')
    .setBackground('#1a1a1a')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  Logger.log('Headers set up. ' + HEADERS.length + ' columns.');
}

/**
 * Reçoit les réponses du quiz en POST et les ajoute au sheet.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Construit la ligne dans l'ordre des HEADERS
    const row = HEADERS.map(h => {
      if (h === 'timestamp') {
        return data.timestamp ? new Date(data.timestamp) : new Date();
      }
      return data[h] !== undefined && data[h] !== null ? data[h] : '';
    });

    sheet.appendRow(row);

    // Email de notification (best-effort, ne bloque pas la réponse)
    try {
      sendNotificationEmail(data);
    } catch (mailErr) {
      Logger.log('Mail error (non-blocking): ' + mailErr);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, received: HEADERS.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log('doPost error: ' + err);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Permet de tester via GET (ouvrir l'URL dans un navigateur)
 */
function doGet(e) {
  return ContentService
    .createTextOutput('9MM Test Consommateur endpoint OK. POST your data here.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function sendNotificationEmail(data) {
  const variant = data.variant || '?';
  const nbProd = data.nb_produits || '?';
  const subject = '[9MM Test Conso] Nouvelle réponse · ' + variant + ' · ' + nbProd + ' produit(s)';

  let body = 'Nouvelle réponse au test consommateur.\n\n';
  body += 'Variante : ' + variant + '\n';
  body += 'Nombre de produits : ' + nbProd + '\n';
  body += 'Email participant : ' + (data.email || '(non renseigné)') + '\n';
  body += 'Profil : ' + (data.age || '?') + ' / ' + (data.sexe || '?') + ' / ' + (data.frequence || '?') + '\n\n';

  if (data.p1_couleur) {
    body += '--- Produit 1 (' + data.p1_couleur + ') ---\n';
    body += 'Note globale : ' + (data.p1_note_globale || '?') + '/9\n';
    body += 'Goût : ' + (data.p1_gout || '?') + '\n';
    body += 'Sucre : ' + (data.p1_sucre || '?') + '\n';
    body += 'Acidité : ' + (data.p1_acidite || '?') + '\n';
    body += 'Odeur : ' + (data.p1_odeur || '?') + '\n';
    body += 'Texture : ' + (data.p1_texture || '?') + '\n';
    body += 'Pétillance : ' + (data.p1_petillance || '?') + '\n';
    body += 'Couleur : ' + (data.p1_couleur_visuel || '?') + '\n';
    body += 'Intention d\'achat : ' + (data.p1_intention_achat || '?') + '\n';
    body += 'Prix : ' + (data.p1_prix || '?') + '\n\n';
  }

  if (data.p2_couleur) {
    body += '--- Produit 2 (' + data.p2_couleur + ') ---\n';
    body += 'Note globale : ' + (data.p2_note_globale || '?') + '/9\n';
    body += 'Goût : ' + (data.p2_gout || '?') + '\n';
    body += 'Sucre : ' + (data.p2_sucre || '?') + '\n';
    body += 'Acidité : ' + (data.p2_acidite || '?') + '\n';
    body += 'Odeur : ' + (data.p2_odeur || '?') + '\n';
    body += 'Texture : ' + (data.p2_texture || '?') + '\n';
    body += 'Pétillance : ' + (data.p2_petillance || '?') + '\n';
    body += 'Couleur : ' + (data.p2_couleur_visuel || '?') + '\n';
    body += 'Intention d\'achat : ' + (data.p2_intention_achat || '?') + '\n';
    body += 'Prix : ' + (data.p2_prix || '?') + '\n\n';
  }

  if (data.prefere) {
    body += 'Préféré : ' + data.prefere + '\n\n';
  }

  if (data.aime || data.ameliorer || data.description) {
    body += '--- Avis libre ---\n';
    if (data.aime) body += 'Aimé : ' + data.aime + '\n';
    if (data.ameliorer) body += 'À améliorer : ' + data.ameliorer + '\n';
    if (data.description) body += 'Description : ' + data.description + '\n';
  }

  body += '\n---\nUser agent : ' + (data.user_agent || '?');

  MailApp.sendEmail(NOTIFICATION_EMAIL, subject, body);
}
