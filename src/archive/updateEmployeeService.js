function updateEmployeeSheet() {
    Logger.log("=== Début de updateEmployeeSheet ===");
    
    var employees = fetchEmployeesFromJibble();
  
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var employeeSheet = sheet.getSheetByName('Employés');
    var pointagesSheet = ensureSheetExists('Pointages', initializePointagesHeaders);
    var timeTrackingSheet = ensureSheetExists('Génération des Salaires', updateTimeTrackingHeaders);
    var avancesSheet = ensureSheetExists('Avances sur salaires', initializeAvancesHeaders);
  
    // Logs pour vérifier l'état des feuilles
    Logger.log("État des feuilles après initialisation:");
    Logger.log("LastRow employeeSheet: " + employeeSheet.getLastRow());
    Logger.log("LastRow pointagesSheet: " + pointagesSheet.getLastRow());
    Logger.log("LastRow timeTrackingSheet: " + timeTrackingSheet.getLastRow());
    Logger.log("LastRow avancesSheet: " + avancesSheet.getLastRow());
  
    var existingUserIds = employeeSheet.getLastRow() > 1 ? 
      employeeSheet.getRange(2, 1, employeeSheet.getLastRow() - 1, 1).getValues().flat() : [];
      
    var activeEmployeeIds = employees.filter(emp => emp.status === "Joined").map(emp => emp.id);
    var employeesToRemove = existingUserIds.filter(id => !activeEmployeeIds.includes(id));
  
    employeesToRemove.forEach(userId => {
      deleteRowFromSheet(employeeSheet, userId);
      deleteRowFromSheet(pointagesSheet, userId);
      deleteRowFromSheet(timeTrackingSheet, userId);
      deleteRowFromSheet(avancesSheet, userId);
    });
  
    var newEmployeeData = [];
    var newPointagesData = [];
    var newTimeTrackingData = [];
    var newAvancesData = [];
  
    // Traiter chaque employé actif
    employees.forEach(function(emp) {
      if (emp.status === "Joined" && !["Owner"].includes(emp.role)) {
        Logger.log(`Traitement de l'employé: ${emp.fullName} (ID: ${emp.id})`);
        
        var firstName = emp.fullName.split(' ')[0];
        var lastName = emp.fullName.split(' ').slice(1).join(' ') || "";
        
        var empData = [emp.id, emp.createdAt, firstName, lastName];
        var basicData = [emp.id, firstName, lastName];
        
        var existingIndex = existingUserIds.indexOf(emp.id);
        
       if (existingIndex !== -1) {
        var rowIndex = existingIndex + 2;
        var timeTrackingRowIndex = existingIndex + 3;
        Logger.log(`Mise à jour de l'employé existant: ${emp.fullName} à la ligne ${rowIndex}`);
        Logger.log(`RowIndex calculé: ${rowIndex}, TimeTrackingRowIndex: ${timeTrackingRowIndex}`);
          
      try {
        Logger.log("Tentative de mise à jour des ranges:");
        Logger.log(`employeeSheet - ligne ${rowIndex}`);
        employeeSheet.getRange(rowIndex, 1, 1, 4).setValues([empData]);
        Logger.log(`pointagesSheet - ligne ${rowIndex}`);
        pointagesSheet.getRange(rowIndex, 1, 1, 3).setValues([basicData]);
        Logger.log(`timeTrackingSheet - ligne ${timeTrackingRowIndex}`);
        timeTrackingSheet.getRange(timeTrackingRowIndex, 1, 1, 3).setValues([basicData]);
        Logger.log(`avancesSheet - ligne ${rowIndex}`);
        avancesSheet.getRange(rowIndex, 1, 1, 3).setValues([basicData]);
      } catch (e) {
        Logger.log(`❌ Erreur lors de la mise à jour de l'employé ${emp.fullName}: ${e}`);
      }
        } else {
          Logger.log(`Ajout d'un nouvel employé: ${emp.fullName}`);
          newEmployeeData.push(empData);
          newPointagesData.push(basicData);
          newTimeTrackingData.push(basicData);
          newAvancesData.push(basicData);
        }
      }
    });
  
    try {
      if (newEmployeeData.length > 0) {
        Logger.log(`Ajout de ${newEmployeeData.length} nouveaux employés`);
        employeeSheet.getRange(employeeSheet.getLastRow() + 1, 1, newEmployeeData.length, 4).setValues(newEmployeeData);
        pointagesSheet.getRange(pointagesSheet.getLastRow() + 1, 1, newPointagesData.length, 3).setValues(newPointagesData);
        timeTrackingSheet.getRange(Math.max(3, timeTrackingSheet.getLastRow() + 1), 1, newTimeTrackingData.length, 3).setValues(newTimeTrackingData);
        avancesSheet.getRange(avancesSheet.getLastRow() + 1, 1, newAvancesData.length, 3).setValues(newAvancesData);
      }
    } catch (e) {
      Logger.log(`Erreur lors de l'ajout des nouveaux employés: ${e}`);
    }
  
    setCheckboxColumns(timeTrackingSheet, "H", 3);
  
    Logger.log("=== Fin de updateEmployeeSheet ===");
  }
  
  function setCheckboxColumns(sheet, columnLetter, startRow) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= startRow) {
      sheet.getRange(`${columnLetter}${startRow}:${columnLetter}${lastRow}`).insertCheckboxes();
    }
  }
  
  
  function deleteRowFromSheet(sheet, userId) {
    SpreadsheetApp.flush();
  
    var lastRow = sheet.getLastRow();
  
    var startRow = sheet.getName() === 'Génération des Salaires' ? 3 : 2;
  
    if (lastRow < startRow + 1) {
      Logger.log(`Feuille ${sheet.getName()} vide ou sans lignes de données, aucune ligne à supprimer.`);
      return;
    }
  
    var range = sheet.getRange(startRow, 1, lastRow - startRow + 1, 1).getValues().flat();
  
    for (var i = 0; i < range.length; i++) {
      if (range[i] === userId) {
        sheet.deleteRow(i + startRow);
        SpreadsheetApp.flush();
        return;
      }
    }
  }
  
  function ensureSheetExists(sheetName, initializeHeadersFunc) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
      initializeHeadersFunc(sheet);
    } else if (sheet.getLastRow() === 0) {
      initializeHeadersFunc(sheet);
    }
    return sheet;
  }
  
  function onEdit(e) {
    var sheet = e.source.getActiveSheet();
    var range = e.range;
    var editedRow = range.getRow();
    var editedColumn = range.getColumn();
    var editedValue = e.value;
  
    if (sheet.getName() === 'Pointages' && editedColumn >= 4 && editedRow >= 2 && editedColumn <= 45) {
      const validFormat = /^(0h|À Corriger|(\d{1,2}h( \d{1,2}m)?))$/;
  
      if (!validFormat.test(editedValue)) {
        range.setFontColor("red");
        SpreadsheetApp.getUi().alert(
          "Format invalide. Veuillez entrer une valeur au format:\n" +
          "'0h'\n" +
          "'Xh'\n" +
          "'Xh Xm'\n" +
          "'Xh XXm'\n" +
          "'XXh Xm'\n" +
          "'XXh XXm'\n" +
          "'À Corriger' avec un C majuscule\n" +
          "'X correspond à un chiffre et il y a un espace après l'heure (h) et n'oubliez pas le (m) à la fin s'il y a des minutes."
        );
      } else {
        range.setFontColor("green");
      }
    }
  }