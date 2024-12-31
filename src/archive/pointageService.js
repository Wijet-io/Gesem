function initializePointagesHeaders() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pointages');
    if (!sheet) {
      Logger.log("Feuille 'Pointages' introuvable.");
      return;
    }
  
    sheet.clear();
    sheet.appendRow(['UserId', 'Prénom', 'Nom']); 
  
    // Générer les dates des 42 derniers jours (6 semaines)
    var today = new Date();
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);  // Commence par hier
    var dates = [];
  
    for (var i = 41; i >= 0; i--) {
      var date = new Date(yesterday);  // Partir d'hier
      date.setDate(yesterday.getDate() - i);  // Reculer de 'i' jours depuis hier
      dates.push(formatDateForPointageHeader(date));
    }
  
    // Ajouter les dates en tant qu'en-têtes à partir de la 4ème colonne
    for (var j = 0; j < dates.length; j++) {
      sheet.getRange(1, 4 + j).setValue(dates[j]);
    }
  }
  
  function updatePointagesDaily() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pointages');
    if (!sheet) {
      Logger.log("Onglet 'Pointages' non trouvé.");
      return;
    }
  
    // Supprimer la colonne la plus ancienne (colonne 4)
    sheet.deleteColumn(4);
  
    // Vérifier la dernière colonne actuelle
    var lastColumn = sheet.getLastColumn();
    var lastDateHeader = sheet.getRange(1, lastColumn).getValue(); // Date de la dernière colonne
  
    // Convertir la dernière date en objet Date pour comparaison
    var lastDate = parseDateFromHeader(lastDateHeader);
  
    // Ajouter une nouvelle colonne avec la date suivante
    var newDate = new Date(lastDate);
    newDate.setDate(lastDate.getDate() + 1); // Ajouter un jour à la dernière date
  
    // Vérifier la continuité des jours de la semaine
    var newDayName = getDayName(newDate);
    var formattedNewDate = formatDateForPointageHeader(newDate); // Formater la nouvelle date
  
    sheet.getRange(1, lastColumn + 1).setValue(newDayName + " " + formattedNewDate); // Ajouter la nouvelle date
  
    Logger.log("Les dates dans 'Pointages' ont été mises à jour.");
  }
  
  function parseDateFromHeader(header) {
    // Si l'en-tête est déjà un objet Date, le retourner directement
    if (header instanceof Date) {
      return header; // Retourne directement l'objet Date
    }
    
    // Si l'en-tête est une chaîne de caractères, le traiter comme avant
    if (typeof header === 'string') {
      var parts = header.split(' '); // Sépare 'Lun' et '07/10'
      
      if (parts.length < 2) {
        Logger.log("Erreur: Format de date incorrect dans l'en-tête: " + header);
        return null;
      }
      
      var dateParts = parts[1].split('/'); // Sépare '07' et '10' pour obtenir le jour et le mois
      if (dateParts.length < 2) {
        Logger.log("Erreur: Format de jour/mois incorrect dans l'en-tête: " + header);
        return null;
      }
  
      var day = parseInt(dateParts[0]);
      var month = parseInt(dateParts[1]) - 1; // Le mois en JavaScript commence à 0
      var year = new Date().getFullYear(); // Obtenir l'année actuelle
  
      return new Date(year, month, day); // Retourne un objet Date
    }
    
    Logger.log("Erreur: L'en-tête fourni n'est pas un format valide: " + header);
    return null; // Retourne null en cas de valeur invalide
  }
  
  
  // Fonction pour obtenir le nom du jour de la semaine
  function getDayName(date) {
    var days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  }
  
  
  function formatDateForPointageHeader(date) {
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    return `${day}/${month}/${year}`; // Format pour l'en-tête (JJ/MM/AAAA)
  }