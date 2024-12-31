// Initialiser les en-têtes pour les colonnes des avances
function initializeAvancesHeaders(sheet) {
    sheet.clear();
    sheet.appendRow(['UserId', 'Prénom', 'Nom', 'Date Acompte Semaine 1', 'Montant Acompte Semaine 1', 'Date Acompte Semaine 2', 'Montant Acompte Semaine 2']);
  }
  
  // Mettre à jour les données des employés dans la feuille "Avances sur salaires"
  function updateEmployeeInAvances(avancesSheet, userId, empData) {
    var lastRow = avancesSheet.getLastRow();
    if (lastRow < 2) return;
  
    var range = avancesSheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    var rowIndex = range.indexOf(userId) + 2;
  
    if (rowIndex > 1) {
      avancesSheet.getRange(rowIndex, 2, 1, 6).setValues([empData.slice(1)]);
    } else {
      avancesSheet.appendRow(empData);
    }
  }
  
  // Récupérer les acomptes pour les deux semaines
  function getSalaryAdvances(avancesSheet) {
    const lastRow = avancesSheet.getLastRow();
    if (lastRow < 2) return [];
  
    const advancesData = avancesSheet.getRange(2, 1, lastRow - 1, 7).getValues(); 
    return advancesData.filter(row => (row[3] && row[4]) || (row[5] && row[6])); // Vérifie les dates et montants des deux semaines
  }
  
  function archiveAndClearSalaryAdvances() {
    // Utilisez ensureSheetExists pour obtenir ou créer la feuille "Avances sur salaires"
    const avancesSheet = ensureSheetExists('Avances sur salaires', initializeAvancesHeaders);
  
    // Vérifiez que la feuille existe bien
    if (!avancesSheet) {
      Logger.log("La feuille 'Avances sur salaires' est introuvable.");
      return;
    }
  
    const lastRow = avancesSheet.getLastRow();
    if (lastRow < 2) return;
  
    const archiveSheet = ensureArchiveSheet();
    const avancesData = avancesSheet.getRange(2, 1, lastRow - 1, 7).getValues();
  
    avancesData.forEach(row => {
      const [userId, firstName, lastName, date1, amount1, date2, amount2] = row;
  
      // Créer une entrée d'archive pour chaque acompte individuel
      if (date1 && amount1) {
        archiveSheet.appendRow([userId, firstName, lastName, date1, amount1]);
      }
      if (date2 && amount2) {
        archiveSheet.appendRow([userId, firstName, lastName, date2, amount2]);
      }
    });
  
    // Effacer le contenu des colonnes d'acompte dans l'onglet de saisie
    avancesSheet.getRange(2, 4, lastRow - 1, 4).clearContent(); 
  }
  
  // Assurer l'existence de la feuille "Archive des acomptes" avec les en-têtes
  function ensureArchiveSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let archiveSheet = sheet.getSheetByName('Archive des acomptes');
  
    if (!archiveSheet) {
      archiveSheet = sheet.insertSheet('Archive des acomptes');
      archiveSheet.appendRow(['UserId', 'Prénom', 'Nom', 'Date Acompte', 'Montant Acompte']);
    }
    return archiveSheet;
  }
  