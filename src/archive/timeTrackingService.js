function setInitialDateHeaders() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Génération des Salaires');
    const userDate = sheet.getRange('I2').getValue(); // Lire la date de départ dans la cellule I2
    
    if (!userDate) {
      SpreadsheetApp.getUi().alert("Aucune date de départ fournie dans I2.");
      return;
    }
    
    const baseDate = new Date(userDate);
    
    // Vérifier que la date est valide
    if (isNaN(baseDate.getTime())) {
      SpreadsheetApp.getUi().alert("La date fournie est invalide. Elle doit correspondre à un lundi des derniers 42 jours maximum.");
      return;
    }
  
    // Vérifier que la date est un lundi
    if (baseDate.getDay() !== 1) { // 1 correspond à lundi
      SpreadsheetApp.getUi().alert("La date fournie est invalide. Elle doit correspondre à un lundi des derniers 42 jours maximum.");
      return;
    }
  
    // Calculer la date du lundi de la semaine en cours
    const today = new Date();
    const daysSinceMonday = today.getDay() === 0 ? 6 : today.getDay() - 1;
    const currentMonday = new Date(today.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000);
  
    // Vérifier si la date est dans les 28 derniers jours
    const millisecondsIn28Days = 42 * 24 * 60 * 60 * 1000;
    if (!(baseDate.getTime() >= currentMonday.getTime() - millisecondsIn28Days && baseDate <= currentMonday)) {
      SpreadsheetApp.getUi().alert("La date fournie est invalide. Elle doit correspondre à un lundi des derniers 42 jours maximum.");
      return;
    }
  
    // La date est valide, procéder aux calculs des périodes hebdomadaires
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const firstWeekStart = new Date(baseDate.getTime());
    const firstWeekEnd = new Date(baseDate.getTime() + 6 * millisecondsPerDay);
    const secondWeekStart = new Date(firstWeekEnd.getTime() + millisecondsPerDay);
    const secondWeekEnd = new Date(secondWeekStart.getTime() + 6 * millisecondsPerDay);
  
    // Mettre à jour les en-têtes avec la nouvelle base de date
    updateDateHeaders(baseDate);
  
    // Importer les heures après avoir mis à jour les en-têtes
    importEmployeeHoursForPeriods(firstWeekStart, firstWeekEnd, secondWeekStart, secondWeekEnd);
  
    // Générer le montant cumulé des salaires
    salaryBudget();
  }
  
  
  function updateTimeTrackingHeaders(sheet) {
    // Effacer toutes les anciennes données
    sheet.clear();
  
    // Ajouter les en-têtes pour les deux semaines
    var headers = ['UserId', 'Prénom', 'Nom'];
  
    // Ajouter les en-têtes dans la première ligne
    sheet.appendRow(headers);
  }
  
  function updateDateHeaders(baseDate) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Génération des Salaires');
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    
    if (!sheet) {
      Logger.log("L'onglet 'Génération des Salaires' n'est pas trouvé.");
      return;
    }
  
    const firstWeekStart = new Date(baseDate.getTime());
    const firstWeekEnd = new Date(baseDate.getTime() + 6 * millisecondsPerDay);
    const secondWeekStart = new Date(firstWeekEnd.getTime() + millisecondsPerDay);
    const secondWeekEnd = new Date(secondWeekStart.getTime() + 6 * millisecondsPerDay);
  
    // Formater les dates pour les en-têtes
    const formattedFirstWeek = `Semaine du ${formatDate(firstWeekStart)} au ${formatDate(firstWeekEnd)}`;
    const formattedSecondWeek = `Semaine du ${formatDate(secondWeekStart)} au ${formatDate(secondWeekEnd)}`;
  
    // Mise à jour des en-têtes dans des cellules séparées
    sheet.getRange('D1').mergeAcross().setValue(formattedFirstWeek); // Fusionne les cellules pour la première semaine
    sheet.getRange('F1').mergeAcross().setValue(formattedSecondWeek); // Fusionne les cellules pour la seconde semaine
  
    // Mise à jour des sous-titres pour les heures normales et supplémentaires
    sheet.getRange('D2').setValue("Heures normales");
    sheet.getRange('E2').setValue("Heures supplémentaires");
    sheet.getRange('F2').setValue("Heures normales");
    sheet.getRange('G2').setValue("Heures supplémentaires");
  }
  
  function salaryBudget() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Génération des Salaires');
    const employeeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employés');
  
    if (!sheet || !employeeSheet) {
      Logger.log("Onglet 'Génération des Salaires' ou 'Employés' non trouvé.");
      return;
    }
  
    // Initialiser le total du budget de salaire
    let totalSalaryBudget = 0;
  
    // Récupérer les données des employés depuis l'onglet "Employés"
    const employeeData = employeeSheet.getRange(2, 1, employeeSheet.getLastRow() - 1, 11).getValues();
    const employeeMap = new Map();
  
    // Construire un mapping userId -> {normalRate, extraRate}
    employeeData.forEach(row => {
      const userId = row[0]; // Colonne A : userId
      const normalRate = row[5];
      const extraRate = row[6];
      employeeMap.set(userId, { normalRate, extraRate });
    });
  
    // Récupérer les données de l'onglet "Génération des Salaires"
    const employees = sheet.getRange(3, 1, sheet.getLastRow() - 2, 7).getValues();
  
    employees.forEach(employee => {
      const employeeId = employee[0];
      const normalHoursTotal = parseFloat(employee[3]) + parseFloat(employee[5]) || 0; // Heures normales totales (semaines 1 + 2)
      const extraHoursTotal = parseFloat(employee[4]) + parseFloat(employee[6]) || 0; // Heures supplémentaires totales (semaines 1 + 2)
  
      // Récupérer les taux pour cet employé
      const rates = employeeMap.get(employeeId);
      if (!rates) {
        Logger.log(`Taux non trouvés pour l'employé avec l'ID: ${employeeId}`);
        return;
      }
  
      // Calculer le salaire pour cet employé
      const normalPay = normalHoursTotal * rates.normalRate;
      const extraPay = extraHoursTotal * rates.extraRate;
      const totalPay = normalPay + extraPay;
  
      // Ajouter au budget total
      totalSalaryBudget += totalPay;
    });
  
    // Afficher le budget total des salaires dans la cellule K2
    sheet.getRange('K2').setValue(totalSalaryBudget.toFixed(2));
  }
  
  
  function formatDate(date) {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }
  
  function sumEmployeeHoursForPeriod(attendanceSheet, employeeId, startDate, endDate, contractDailyHours) {
    const lastRow = attendanceSheet.getLastRow();
    const lastColumn = attendanceSheet.getLastColumn();
  
    let totalNormalHours = 0;
    let totalExtraHours = 0;
    let hasCorrectionNeeded = false; // Indicateur si "À corriger" est trouvé
    let deficitDays = []; // Stocke les jours qui n'ont pas atteint le quota contractuel
  
    // Parcourir les lignes pour trouver l'employé
    for (let i = 2; i <= lastRow; i++) {
      const rowEmployeeId = attendanceSheet.getRange(i, 1).getValue();
      if (rowEmployeeId === employeeId) {
        for (let j = 4; j <= lastColumn; j++) {
          const dateValue = attendanceSheet.getRange(1, j).getValue();
          const date = new Date(dateValue);
  
          // Vérifier si la date est dans la période
          if (date >= startDate && date <= endDate) {
            const hoursWorked = attendanceSheet.getRange(i, j).getValue();
  
            // Si on trouve "À Corriger", on marque le flag et ne cumule pas
            if (hoursWorked === "À Corriger") {
              hasCorrectionNeeded = true;
              Logger.log(`À Corriger trouvé pour ${employeeId} à la date ${dateValue}`);
            } else {
              const hoursInDecimal = convertToDecimalHours(hoursWorked);
  
              if (hoursInDecimal >= contractDailyHours) {
                // Si l'employé dépasse ses heures contractuelles
                totalNormalHours += contractDailyHours;
                totalExtraHours += (hoursInDecimal - contractDailyHours);
                Logger.log(`Jour complet : ${hoursInDecimal}h -> ${contractDailyHours}h en normal, ${(hoursInDecimal - contractDailyHours)}h en supp`);
              } else if (hoursInDecimal >= 5) {
                // Si l'employé a travaillé entre 5 heures et le quota contractuel
                totalNormalHours += hoursInDecimal;
                // Ajouter à la liste des jours avec déficit pour ajuster plus tard
                deficitDays.push({date: dateValue, missingHours: contractDailyHours - hoursInDecimal});
                Logger.log(`Jour incomplet : ${hoursInDecimal}h -> ${hoursInDecimal}h en normal, manque ${contractDailyHours - hoursInDecimal}h`);
              } else {
                // Si l'employé a travaillé moins de 5 heures
                totalExtraHours += hoursInDecimal;
                Logger.log(`Jour de moins de 5h : ${hoursInDecimal}h -> Tout en heures supp`);
              }
            }
          }
        }
      }
    }
  
    // Deuxième passe : combler les jours incomplets avec les heures supplémentaires
    deficitDays.forEach(day => {
      const missingHours = day.missingHours;
      if (totalExtraHours >= missingHours) {
        totalNormalHours += missingHours;
        totalExtraHours -= missingHours;
        Logger.log(`Comblement du jour incomplet avec ${missingHours}h d'heures supplémentaires.`);
      } else if (totalExtraHours > 0) {
        // Si on n'a pas assez d'heures supplémentaires pour combler entièrement
        totalNormalHours += totalExtraHours;
        Logger.log(`Comblement partiel du jour incomplet avec ${totalExtraHours}h d'heures supplémentaires.`);
        totalExtraHours = 0;
      }
    });
  
    // Arrondir les heures normales et supplémentaires pour éviter les erreurs d'arrondi cumulées
    totalNormalHours = parseFloat(totalNormalHours.toFixed(2));
    totalExtraHours = parseFloat(totalExtraHours.toFixed(2));
  
    Logger.log(`Total final pour ${employeeId}: Heures normales: ${totalNormalHours}h, Heures supplémentaires: ${totalExtraHours}h`);
  
    return {
      normalHours: totalNormalHours.toFixed(2),
      extraHours: totalExtraHours.toFixed(2),
      hasCorrectionNeeded: hasCorrectionNeeded
    };
  }
  
  function convertToDecimalHours(hoursWorked) {
    const parts = hoursWorked.split('h');
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    return hours + (minutes / 60); // Convertit les heures et minutes en décimal
  }
  
  
  
  function importEmployeeHoursForPeriods(firstWeekStart, firstWeekEnd, secondWeekStart, secondWeekEnd) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const salarySheet = sheet.getSheetByName('Génération des Salaires');
    const attendanceSheet = sheet.getSheetByName('Pointages');
    const employeeSheet = sheet.getSheetByName('Employés');
  
    if (!salarySheet || !attendanceSheet || !employeeSheet) {
      Logger.log("Onglet 'Génération des Salaires', 'Pointages' ou 'Employés' non trouvé.");
      return;
    }
  
    // Récupérer les heures contractuelles de chaque employé depuis l'onglet "Employés"
    const employeeData = employeeSheet.getRange(2, 1, employeeSheet.getLastRow() - 1, 7).getValues();
    const employeeMap = new Map();
  
    // Construire un mapping userId -> heures contractuelles
    employeeData.forEach(row => {
      const userId = row[0]; // Colonne A: userId
      const contractDailyHours = row[4]; // Colonne I: heures contractuelles
      employeeMap.set(userId, contractDailyHours);
    });
  
    // Récupérer les userId des employés dans l'onglet "Génération des Salaires"
    const employees = salarySheet.getRange(3, 1, salarySheet.getLastRow() - 2, 1).getValues().flat();
  
    employees.forEach((employeeId, index) => {
      if (!employeeId) return;
  
      // Récupérer les heures contractuelles depuis le mapping
      const contractDailyHours = employeeMap.get(employeeId);
      if (!contractDailyHours) {
        Logger.log(`Heures contractuelles non trouvées pour l'employé avec l'ID: ${employeeId}`);
        return;
      }
  
      const rowIndex = index + 3; // Ligne dans l'onglet "Génération des Salaires"
  
      // Cumul des heures normales et supplémentaires pour la première semaine
      const firstWeekResult = sumEmployeeHoursForPeriod(attendanceSheet, employeeId, firstWeekStart, firstWeekEnd, contractDailyHours);
      salarySheet.getRange(rowIndex, 4).setValue(firstWeekResult.normalHours); // Colonne D pour les heures normales semaine 1
      salarySheet.getRange(rowIndex, 5).setValue(firstWeekResult.extraHours); // Colonne E pour les heures supplémentaires semaine 1
  
      // Cumul des heures normales et supplémentaires pour la seconde semaine
      const secondWeekResult = sumEmployeeHoursForPeriod(attendanceSheet, employeeId, secondWeekStart, secondWeekEnd, contractDailyHours);
      salarySheet.getRange(rowIndex, 6).setValue(secondWeekResult.normalHours); // Colonne F pour les heures normales semaine 2
      salarySheet.getRange(rowIndex, 7).setValue(secondWeekResult.extraHours); // Colonne G pour les heures supplémentaires semaine 2
    });
  }
  
  function formatCell(range, hasCorrectionNeeded) {
    if (hasCorrectionNeeded) {
      range.setFontWeight('bold').setFontColor('red');
    } else {
      range.setFontWeight('normal').setFontColor('black');
    }
  }
  