function generatePayReportsForAllEmployees() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Génération des Salaires');
    const employeeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employés');
    const avancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Avances sur salaires');
  
    // Retrieve salary advances
    const advances = getSalaryAdvances(avancesSheet);
    
    // Setup for report generation
    const baseDate = new Date(sheet.getRange('I2').getValue());
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const firstWeekStart = new Date(baseDate.getTime());
    const firstWeekEnd = new Date(baseDate.getTime() + 6 * millisecondsPerDay);
    const secondWeekStart = new Date(firstWeekEnd.getTime() + millisecondsPerDay);
    const secondWeekEnd = new Date(secondWeekStart.getTime() + 6 * millisecondsPerDay);
  
    const folderName = `Rapport-${formatReportDate(firstWeekStart)}-${formatReportDate(secondWeekEnd)}`;
    const parentFolder = DriveApp.getFolderById('1LiWwpl472HVeYmZ-CBBEyaR9YP-z3JcX');
    const reportsFolder = parentFolder.createFolder(folderName);
  
    const lastRow = sheet.getLastRow();
    const employeeDataRange = sheet.getRange(3, 1, lastRow - 2, 7).getDisplayValues();
  
  employeeDataRange.forEach(employee => {
      const employeeId = employee[0];
      const employeeName = `${employee[1]} ${employee[2]}`;
      
      Logger.log('------ Données brutes pour ' + employeeName + ' ------');
      Logger.log('Données originales semaine 1: Normal=' + employee[3] + ', Extra=' + employee[4]);
      Logger.log('Données originales semaine 2: Normal=' + employee[5] + ', Extra=' + employee[6]);
      
      const normalHoursWeek1 = parseFloat(employee[3]);
      const extraHoursWeek1 = parseFloat(employee[4]);
      const normalHoursWeek2 = parseFloat(employee[5]);
      const extraHoursWeek2 = parseFloat(employee[6]);
      
      Logger.log('Après parsing semaine 1: Normal=' + normalHoursWeek1 + ', Extra=' + extraHoursWeek1);
      Logger.log('Après parsing semaine 2: Normal=' + normalHoursWeek2 + ', Extra=' + extraHoursWeek2);
      
      const normalHoursTotal = (normalHoursWeek1 + normalHoursWeek2).toFixed(2);
      const extraHoursTotal = (extraHoursWeek1 + extraHoursWeek2).toFixed(2);
      
      Logger.log('Totaux: Normal=' + normalHoursTotal + ', Extra=' + extraHoursTotal);
  
      const employeeInfo = getEmployeeInfo(employeeId, employeeSheet);
      const normalRate = employeeInfo.normalRate;
      const extraRate = employeeInfo.extraRate;
  
      const normalPay = calculateNormalPay(normalHoursTotal, normalRate);
      const extraPay = calculateExtraPay(extraHoursTotal, extraRate);
      const totalPay = calculateTotalPay(normalHoursTotal, extraHoursTotal, normalRate, extraRate);
  
      // Retrieve weekly advances
      let advanceAmountWeek1 = 0, advanceAmountWeek2 = 0;
      let advanceNoteWeek1 = '', advanceNoteWeek2 = '';
      const advance = advances.find(adv => adv[0] === employeeId);
      
      if (advance) {
        if (advance[4]) {
          advanceAmountWeek1 = parseFloat(advance[4]) || 0;
          const formattedDateWeek1 = Utilities.formatDate(new Date(advance[3]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
          advanceNoteWeek1 = `Acompte Semaine 1 : ${formattedDateWeek1} - ${advanceAmountWeek1}€`;
        }
        if (advance[6]) {
          advanceAmountWeek2 = parseFloat(advance[6]) || 0;
          const formattedDateWeek2 = Utilities.formatDate(new Date(advance[5]), Session.getScriptTimeZone(), 'dd/MM/yyyy');
          advanceNoteWeek2 = `Acompte Semaine 2 : ${formattedDateWeek2} - ${advanceAmountWeek2}€`;
        }
      }
  
      const totalAdvance = (advanceAmountWeek1 + advanceAmountWeek2).toFixed(2);
      const finalPay = (parseFloat(totalPay) - totalAdvance).toFixed(2);
  
      Logger.log('------ Données envoyées au PDF ------');
      Logger.log('Semaine 1: Normal=' + normalHoursWeek1 + ', Extra=' + extraHoursWeek1);
      Logger.log('Semaine 2: Normal=' + normalHoursWeek2 + ', Extra=' + extraHoursWeek2);
      Logger.log('Totaux: Normal=' + normalHoursTotal + ', Extra=' + extraHoursTotal);
  
      // Generate PDF with all required information
      const pdfBlob = generatePDF({
        name: employeeName,
        contractDailyHours: employeeInfo.contractDailyHours,
        normalHoursWeek1,
        extraHoursWeek1,
        normalHoursWeek2,
        extraHoursWeek2,
        normalHoursTotal,
        extraHoursTotal,
        normalPay,
        extraPay,
        totalPay,
        advanceAmountWeek1,
        advanceAmountWeek2,
        finalPay,
        firstWeekStart,
        firstWeekEnd,
        secondWeekStart,
        secondWeekEnd,
        advanceNoteWeek1,
        advanceNoteWeek2
      });
      
      pdfBlob.setName(`Rapport_${employeeName}.pdf`);
      reportsFolder.createFile(pdfBlob);
    });
  
    MailApp.sendEmail({
      to: getEmailForPayReports(),
      subject: `Rapports de paie générés pour la période du ${formatReportDate(firstWeekStart)} au ${formatReportDate(secondWeekEnd)}`,
      htmlBody: `Les rapports de paie pour la période du ${formatReportDate(firstWeekStart)} au ${formatReportDate(secondWeekEnd)} ont été générés. Consultez-les ici : ${reportsFolder.getUrl()}`
    });
  
    archiveAndClearSalaryAdvances(avancesSheet);
  }
  
  function getEmailForPayReports() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('⚙️');
    var email = sheet.getRange('B3').getValue();
    return email;
  }
  
  // Fonction pour récupérer les informations d'un employé depuis l'onglet "Employés"
  function getEmployeeInfo(employeeId, employeeSheet) {
    const employeeData = employeeSheet.getRange(2, 1, employeeSheet.getLastRow() - 1, 11).getValues();
    for (let i = 0; i < employeeData.length; i++) {
      if (employeeData[i][0] === employeeId) {
        return {
          contractDailyHours: employeeData[i][4],
          normalRate: employeeData[i][5],
          extraRate: employeeData[i][6]
        };
      }
    }
    throw new Error(`Informations de l'employé avec l'ID ${employeeId} non trouvées`);
  }
  
  // Générer le PDF avec toutes les informations
  function generatePDF(employeeData) {
    const template = HtmlService.createTemplateFromFile('reportPDF');
  
    template.employeeName = employeeData.name;
    template.contractDailyHours = employeeData.contractDailyHours;
    template.firstWeekStart = formatDateForDisplay(employeeData.firstWeekStart);
    template.firstWeekEnd = formatDateForDisplay(employeeData.firstWeekEnd);
    template.normalHoursWeek1 = employeeData.normalHoursWeek1;
    template.extraHoursWeek1 = employeeData.extraHoursWeek1;
    template.secondWeekStart = formatDateForDisplay(employeeData.secondWeekStart);
    template.secondWeekEnd = formatDateForDisplay(employeeData.secondWeekEnd);
    template.normalHoursWeek2 = employeeData.normalHoursWeek2;
    template.extraHoursWeek2 = employeeData.extraHoursWeek2;
    template.normalHoursTotal = employeeData.normalHoursTotal;
    template.extraHoursTotal = employeeData.extraHoursTotal;
    template.normalPay = employeeData.normalPay;
    template.extraPay = employeeData.extraPay;
    template.totalPay = employeeData.totalPay;
    template.finalPay = employeeData.finalPay;
    template.advanceNoteWeek1 = employeeData.advanceNoteWeek1 || '';
    template.advanceNoteWeek2 = employeeData.advanceNoteWeek2 || '';
  
    const htmlContent = template.evaluate().getContent();
    return Utilities.newBlob(htmlContent, 'text/html').getAs('application/pdf');
  }
  
    function formatDateForDisplay(date) {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    }
  
    // Fonctions utilitaires pour le calcul des montants avec les taux récupérés
    function calculateNormalPay(hours, normalRate) {
      return (hours * normalRate).toFixed(2); // Utilisation du taux normal
    }
  
    function calculateExtraPay(hours, extraRate) {
      return (hours * extraRate).toFixed(2); // Utilisation du taux supplémentaire
    }
  
    function calculateTotalPay(normalHours, extraHours, normalRate, extraRate) {
      return (normalHours * normalRate + extraHours * extraRate).toFixed(2); // Calcul du total brut
    }
  
    // Formater la date pour les noms de fichiers et les dossiers
    function formatReportDate(date) {
      return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    }