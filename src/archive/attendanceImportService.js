function convertIsoToHours(isoDuration, returnNumeric = false) {
    if (isoDuration === "PT0S" || !isoDuration) {
      return returnNumeric ? 0 : "0h"; // Pas d'heures travaillées
    }
  
    var regex = /PT(?:(\d+)H)?(?:(\d+)M)?/; // Regex pour extraire les heures et minutes
    var matches = isoDuration.match(regex);
  
    if (!matches) {
      Logger.log("Format de durée non valide : " + isoDuration);
      return returnNumeric ? 0 : "0h"; // Gérer le cas où le format est invalide
    }
  
    var hours = matches[1] ? parseInt(matches[1]) : 0;
    var minutes = matches[2] ? parseInt(matches[2]) : 0;
  
    if (returnNumeric) {
      return hours + (minutes / 60); // Retourne les heures en format numérique (décimal)
    }
  
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`.trim(); // Retourne les heures en format lisible
  }
  
  
  function resetImportProgress() {
    var scriptProperties = PropertiesService.getScriptProperties();
    
    // Supprimer les propriétés de progression pour repartir de zéro
    scriptProperties.deleteProperty('LAST_PROCESSED_EMPLOYEE');
    scriptProperties.deleteProperty('LAST_PROCESSED_DAY');
    
    Logger.log("Progression de l'importation réinitialisée.");
  }
  
  function startFullImport() {
    clearPreviousTriggers();
    // Réinitialiser la progression pour recommencer depuis le début
    resetImportProgress();
    
    // Lancer l'importation des données
    importAttendanceFromJibble();
  }
  
  function importAttendanceFromJibble() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var pointagesSheet = sheet.getSheetByName('Pointages');
    var trackingDates = getDatesFromHeaders(pointagesSheet); // Utilise les en-têtes existants pour récupérer les dates
    var scriptProperties = PropertiesService.getScriptProperties(); // Stocker la progression
  
    // Initialisation de START_TIME pour suivre le début de l'exécution
    var START_TIME = new Date().getTime();
  
    if (!pointagesSheet) {
      Logger.log("Onglet 'Pointages' non trouvé.");
      return;
    }
  
    var lastRow = pointagesSheet.getLastRow();
    if (lastRow < 2) {
      Logger.log("Aucun employé trouvé dans l'onglet 'Pointages'.");
      return;
    }
  
    var employeeData = pointagesSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var employeeIds = employeeData.map(function(row) { return row[0]; });
  
    // Récupérer la progression actuelle (dernier employé et jour traités)
    var lastProcessedEmployee = parseInt(scriptProperties.getProperty('LAST_PROCESSED_EMPLOYEE')) || 0;
    var lastProcessedDay = parseInt(scriptProperties.getProperty('LAST_PROCESSED_DAY')) || 0;
  
    var allDaysProcessed = true; // Pour savoir si tous les jours ont été traités
  
    var today = new Date(); // Obtenir la date d'aujourd'hui pour l'exclure
    
    for (var i = lastProcessedEmployee; i < employeeIds.length; i++) {
      var userId = employeeIds[i];
  
      for (var j = lastProcessedDay; j < trackingDates.length; j++) {
        var date = trackingDates[j];
  
        // Exclure la date d'aujourd'hui
        if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
          Logger.log(`La date ${date} correspond à aujourd'hui, elle est donc ignorée.`);
          continue; // Ignorer l'importation des données d'aujourd'hui
        }
  
        var formattedDate = formatDateForApi(date); // Format "YYYY-MM-DD"
        var columnIndex = j + 4; // Colonne à partir de 4 (les dates)
        var cellValue = pointagesSheet.getRange(i + 2, columnIndex).getValue(); // On vérifie la cellule pour cet employé
  
        if (!cellValue) {
          Logger.log(`Données manquantes pour ${formattedDate} pour l'utilisateur ${userId}. Requête en cours...`);
  
          // Requête à l'API Timesheets Daily
          var url = `https://time-attendance.prod.jibble.io/v1/TimesheetsSummary?period=Custom&date=${formattedDate}&endDate=${formattedDate}&personIds=${userId}&$filter=total ne duration'PT0S'`;
  
          Logger.log("Requête URL: " + url);
          
          // Ajouter une logique de tentative de récupération après une erreur d'API
          var response = retryFetchAttendance(url, 2); // Tente de récupérer les données avec 2 tentatives
  
          if (response) {
            Logger.log("Réponse de l'API pour l'utilisateur " + userId + " à la date " + formattedDate + ": " + JSON.stringify(response));
            processAttendanceData(response, userId, date, pointagesSheet, columnIndex); // Colonne à partir de 4
          } else {
            Logger.log("Aucune donnée reçue pour l'utilisateur " + userId + " à la date " + formattedDate);
          }
  
          // Sauvegarder la progression
          scriptProperties.setProperty('LAST_PROCESSED_EMPLOYEE', i.toString());
          scriptProperties.setProperty('LAST_PROCESSED_DAY', j.toString());
  
          // Vérifier si le temps d'exécution est proche de la limite
          if (isNearExecutionTimeLimit(START_TIME)) {
            Logger.log("Temps d'exécution proche de la limite. Relance du script.");
            scheduleNextRun();
            return; // Sortir pour relancer plus tard
          }
          allDaysProcessed = false; // Un jour a été traité, donc continuer à relancer si nécessaire
        }
      }
      lastProcessedDay = 0; // Réinitialiser les jours pour le prochain employé
    }
  
    if (allDaysProcessed) {
      Logger.log("Importation terminée pour tous les jours et tous les employés.");
      scriptProperties.deleteProperty('LAST_PROCESSED_EMPLOYEE');
      scriptProperties.deleteProperty('LAST_PROCESSED_DAY');
    }
  }
  
  
  // Fonction pour obtenir les dates à partir des en-têtes existants (les colonnes après la 3ème)
  function getDatesFromHeaders(sheet) {
    var lastColumn = sheet.getLastColumn();
    var headers = sheet.getRange(1, 4, 1, lastColumn - 3).getValues()[0]; // Récupère les en-têtes à partir de la 4ème colonne
    var dates = headers.map(function(header) {
      return parseDateFromHeader(header); // Conversion en objet Date
    });
    return dates;
  }
  
  
  // Fonction pour réessayer la requête d'assiduité en cas d'échec
  function retryFetchAttendance(url, retries) {
    var attempt = 0;
    var response;
    while (attempt <= retries) {
      response = fetchAttendance(url);
      if (response) {
        return response;
      }
      Logger.log("Tentative " + (attempt + 1) + " échouée, nouvelle tentative...");
      attempt++;
      Utilities.sleep(1000); // Pause entre les tentatives pour éviter les limites API
    }
    return null; // Si toutes les tentatives échouent, retourner null
  }
  
  
  // Fonction pour vérifier si le temps d'exécution est proche de la limite
  function isNearExecutionTimeLimit(START_TIME) {
    var elapsedTime = Math.round((new Date().getTime() - START_TIME) / 1000); // Temps écoulé en secondes
    return elapsedTime >= (5 * 60); // Par exemple, si le temps dépasse 5 minutes
  }
  
  // Fonction pour supprimer les triggers existants de la fonction importAttendanceFromJibble
  function clearPreviousTriggers() {
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'importAttendanceFromJibble') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  }
  
  // Fonction pour planifier la prochaine exécution en cas de dépassement de la durée
  function scheduleNextRun() {
    clearPreviousTriggers();
    Logger.log("Planification d'une nouvelle exécution dans 5 minutes.");
    ScriptApp.newTrigger('importAttendanceFromJibble')
      .timeBased()
      .after(1 * 60 * 1000) // Relancer après 1 minute
      .create();
  }
  
  
  function processAttendanceData(response, userId, date, pointagesSheet, columnIndex) {
    var row = findRowForUser(pointagesSheet, userId);
  
    if (!response || !response.value || response.value.length === 0) {
      // Si pas de pointages, on marque l'absence (0h)
      pointagesSheet.getRange(row, columnIndex).setValue("0h").setFontColor("red");
      return;
    }
  
    var timesheet = response.value[0];
    var dailyData = timesheet.daily[0];
  
    // Vérification si l'entrée de pointage n'a pas de sortie
    if (!dailyData.lastOut) {
      pointagesSheet.getRange(row, columnIndex).setValue("0h").setFontColor("red");
      return;
    }
  
    // Utiliser `payrollHours` pour obtenir les heures travaillées sans les pauses non payées
    var totalWorked = dailyData.payrollHours;
  
    // Condition de vérification si les heures dépassent 13h
    var totalHours = convertIsoToHours(totalWorked, true); // Utilisation de la version numérique
    if (totalHours > 12.99) {
      pointagesSheet.getRange(row, columnIndex).setValue("À Corriger").setFontColor("red").setFontWeight("bold");
    } else {
      var workedHours = convertIsoToHours(totalWorked); // Format lisible
      pointagesSheet.getRange(row, columnIndex).setValue(workedHours).setFontColor("green");
    }
  }
  
  
  // Fonction pour mettre à jour les en-têtes des jours dans l'onglet "Pointages"
  function updatePointagesSheetHeaders(sheet, trackingDates) {
    var lastColumn = sheet.getLastColumn();
    if (lastColumn > 3) {
      sheet.getRange(1, 4, 1, lastColumn - 3).clearContent(); // Effacer les anciens en-têtes
    }
  
    trackingDates.days.forEach(function(date, index) {
      var formattedDate = formatDateForPointagesHeader(date); // Format pour les en-têtes (ex: 07/10)
      sheet.getRange(1, 4 + index).setValue(formattedDate); // Mettre à jour les en-têtes
    });
  }
  
  function formatDateForApi(date) {
    // Vérifie que l'argument est bien un objet Date
    if (!(date instanceof Date)) {
      Logger.log("Erreur: La valeur fournie à formatDateForApi n'est pas une date valide.");
      return null; // Retourne null si l'argument n'est pas une date
    }
  
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    return `${year}-${month}-${day}`; // Format utilisé pour l'API Jibble (YYYY-MM-DD)
  }
  
  
  // Fonction pour trouver la ligne correspondant à l'userId dans la feuille 'Pointages'
  function findRowForUser(pointagesSheet, userId) {
    var lastRow = pointagesSheet.getLastRow();
    var userIds = pointagesSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    return userIds.indexOf(userId) + 2; // +2 car les lignes commencent à 2
  }
  