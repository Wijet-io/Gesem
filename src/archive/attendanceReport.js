function sendDailyAttendanceReport() {
    var today = new Date();
    var dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  
    // Si nous sommes dimanche (0), ne rien faire
    if (dayOfWeek === 0) {
      Logger.log("Aucun rapport à envoyer le dimanche.");
      return;
    }
  
    // Déterminer la date concernée (samedi si lundi, sinon la veille)
    var targetDate = new Date();
    if (dayOfWeek === 1) { // Si lundi, prendre samedi
      targetDate.setDate(today.getDate() - 2);
    } else { // Sinon, prendre la veille
      targetDate.setDate(today.getDate() - 1);
    }
  
    // Utiliser la fonction existante dans pointageService pour formater la date
    var formattedTargetDate = formatDateForPointageHeader(targetDate);
    Logger.log("Génération du rapport pour la date : " + formattedTargetDate);
  
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pointages');
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
  
    var emailBody = `
      <h3>Rapport de Pointage du ${formattedTargetDate}</h3>
      <p>Les données ci-dessous indiquent soit des employés absents ce jour-là, soit des erreurs de pointage détectées en fonction des règles mises en place :<br>
      <b>- Si 0h, vérifier si l'employé était bien absent ou s'il s'agit d'une erreur de pointage.<br>
      - Si l'employé cumule plus de 13h de travail, il est indiqué "À corriger". Vérifiez l'entrée, la sortie, le lieu de pointage etc...</b><br>
      </p>
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px;">Employé</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Heures</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Action</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Lien</th>
          </tr>
        </thead>
        <tbody>
    `;
  
    var foundIssues = false;
  
    // Trouver la colonne correspondant à la date cible
    var targetColumn = null;
    for (var j = 4; j <= lastColumn; j++) {
      var headerDate = formatDateForPointageHeader(sheet.getRange(1, j).getValue());
      Logger.log("Date de l'en-tête de colonne (formattée): " + headerDate);
      if (headerDate === formattedTargetDate) {
        targetColumn = j;
        break;
      }
    }
  
    if (targetColumn === null) {
      Logger.log("Date cible non trouvée dans les en-têtes.");
      return; // Si la date n'est pas trouvée, arrêter le script
    }
  
    // Parcourir les employés et vérifier les pointages pour la date ciblée
    for (var i = 2; i <= lastRow; i++) {
      var employeeId = sheet.getRange(i, 1).getValue();
      var employeeName = sheet.getRange(i, 2).getValue() + " " + sheet.getRange(i, 3).getValue();
      var workedHours = sheet.getRange(i, targetColumn).getValue();
  
      // Conditions pour inclure dans le rapport (erreurs, absents, plus de 10h)
      if (workedHours === "À Corriger" || workedHours === "0h") {
        foundIssues = true;
  
        var action = '';
        if (workedHours === "À Corriger") {
          action = 'Erreur de pointage ou temps supérieur à 13h';
          Logger.log("Erreur de pointage pour " + employeeName);
        } else if (workedHours === "0h") {
          action = 'Absent';
          Logger.log(employeeName + " est absent");
        }
  
        var formattedJibbleDate = formatDateForJibbleUrl(targetDate); // Conversion en format YYYY-MM-DD pour l'URL Jibble
        var jibbleLink = `https://web.jibble.io/timesheets/${formattedJibbleDate}/${employeeId}/details`;
  
        // Ajouter une ligne pour cet employé dans l'email
        emailBody += `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${employeeName}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${workedHours}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${action}</td>
            <td style="border: 1px solid #ddd; padding: 8px;"><a href="${jibbleLink}">Voir sur Jibble</a></td>
          </tr>
        `;
      }
    }
  
    emailBody += '</tbody></table>';
  
    // Si aucun problème n'est trouvé, ajouter un message sympathique
    if (!foundIssues) {
      emailBody += `
        <p style="color:green; font-size:16px; text-align:center;">💼 Tout est en ordre ! Pas de problème de pointage à signaler pour aujourd'hui. 😊👍</p>
      `;
    } else {
      emailBody += `
        <p style="color:red; font-size:16px; text-align:center;">🚨 Veuillez effectuer les vérifications et corrections nécessaires sur les pointages des employés listés ci-dessus chaque jour et AVANT la génération des récapitulatifs bi-mensuels qui ont lieu tous les 2 mardi à 9h00 (battement de 24h pour la correction avant génération). Merci. 🚨</p>
      `;
    }
  
    // Envoyer l'email dans tous les cas
    MailApp.sendEmail({
      to: getEmailForAttendance(),
      subject: "Rapport quotidien de pointage",
      htmlBody: emailBody
    });
    Logger.log("Rapport envoyé avec succès.");
  }
  
  function getEmailForAttendance() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('⚙️');
    var email = sheet.getRange('B2').getValue();
    return email;
  }
  
  
  // Fonction pour formater la date en YYYY-MM-DD pour l'URL Jibble
  function formatDateForJibbleUrl(date) {
    var year = date.getFullYear();
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var day = ('0' + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }
  
  