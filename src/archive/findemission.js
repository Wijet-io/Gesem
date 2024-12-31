function generateReportForSelectedEmployee() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Génération des Salaires');
    const employeeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Employés');
    const avancesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Avances sur salaires');
  
    // Define reporting period based on the base date in cell I2
    const baseDate = new Date(sheet.getRange('I2').getValue());
    const firstWeekStart = new Date(baseDate.getTime());
    const firstWeekEnd = new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000);
    const secondWeekStart = new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000);
    const secondWeekEnd = new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000);
  
    // Retrieve data from the "Génération des Salaires" sheet, including the checkbox in column H
    const employeeDataRange = sheet.getRange(3, 1, sheet.getLastRow() - 2, 8).getValues();
    const advances = getSalaryAdvances(avancesSheet);
  
    // Identify the selected employee by checking for a ticked checkbox in column H
    let selectedEmployee = null;
    employeeDataRange.forEach((employee) => {
      const isChecked = employee[7];
      if (isChecked) selectedEmployee = employee;
    });
  
    if (!selectedEmployee) {
      Logger.log('No employee selected.');
      return;
    }
  
    const employeeId = selectedEmployee[0];
    const employeeName = `${selectedEmployee[1]} ${selectedEmployee[2]}`;
  
    // Weekly hours
    const normalHoursWeek1 = parseFloat(selectedEmployee[3]) || 0;
    const extraHoursWeek1 = parseFloat(selectedEmployee[4]) || 0;
    const normalHoursWeek2 = parseFloat(selectedEmployee[5]) || 0;
    const extraHoursWeek2 = parseFloat(selectedEmployee[6]) || 0;
    const normalHoursTotal = (normalHoursWeek1 + normalHoursWeek2).toFixed(2);
    const extraHoursTotal = (extraHoursWeek1 + extraHoursWeek2).toFixed(2);
  
    Logger.log(`Generating report for: ${employeeName}`);
  
    // Retrieve employee rates and contract details
    const employeeInfo = getEmployeeInfo(employeeId, employeeSheet);
    const contractDailyHours = employeeInfo.contractDailyHours;
    const normalRate = employeeInfo.normalRate;
    const extraRate = employeeInfo.extraRate;
  
    const normalPay = calculateNormalPay(normalHoursTotal, normalRate);
    const extraPay = calculateExtraPay(extraHoursTotal, extraRate);
    const totalPay = calculateTotalPay(normalHoursTotal, extraHoursTotal, normalRate, extraRate);
  
    // Advances for Week 1 and Week 2
    let advanceAmountWeek1 = 0, advanceAmountWeek2 = 0;
    let advanceNoteWeek1 = '', advanceNoteWeek2 = '';
    const advance = advances.find(adv => adv[0] === employeeId);
  
    if (advance) {
      if (advance[3] && !isNaN(new Date(advance[3]).getTime())) {
        const advanceDateWeek1 = new Date(advance[3]);
        advanceAmountWeek1 = parseFloat(advance[4]) || 0;
        advanceNoteWeek1 = `Acompte Semaine 1 : ${Utilities.formatDate(advanceDateWeek1, Session.getScriptTimeZone(), 'dd/MM/yyyy')} - ${advanceAmountWeek1}€`;
      }
  
      if (advance[5] && !isNaN(new Date(advance[5]).getTime())) {
        const advanceDateWeek2 = new Date(advance[5]);
        advanceAmountWeek2 = parseFloat(advance[6]) || 0;
        advanceNoteWeek2 = `Acompte Semaine 2 : ${Utilities.formatDate(advanceDateWeek2, Session.getScriptTimeZone(), 'dd/MM/yyyy')} - ${advanceAmountWeek2}€`;
      }
    }
  
    const totalAdvance = (advanceAmountWeek1 + advanceAmountWeek2).toFixed(2);
    const finalPay = (parseFloat(totalPay) - totalAdvance).toFixed(2);
  
    // Generate PDF with all required information
    const pdfBlob = generatePDF({
      name: employeeName,
      contractDailyHours,
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
  
    const folderName = `Fin_de_mission_${employeeName}`;
    const parentFolder = DriveApp.getFolderById('1wMdWRs-ZVYpnyKITOS10RM-_j-KpXmwU');
    const reportsFolder = parentFolder.createFolder(folderName);
  
    pdfBlob.setName(`Fin-de-mission_${employeeName}.pdf`);
    reportsFolder.createFile(pdfBlob);
  
    Logger.log(`PDF generated for ${employeeName}`);
  
    // Archive employee on Jibble
    archiveEmployeeOnJibble(employeeId);
  
    // Send notification email
    const emailBody = `Le rapport de fin de mission pour ${employeeName} a été généré avec succès.<br><br>Vous pouvez consulter le rapport via le lien suivant : ${reportsFolder.getUrl()}`;
    MailApp.sendEmail({
      to: getEmailForFinDeMission(),
      subject: `Rapport de fin de mission pour ${employeeName}`,
      htmlBody: emailBody
    });
  
    Logger.log(`Email sent successfully for ${employeeName}`);
  }
  
  function getEmailForFinDeMission() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('⚙️');
    var email = sheet.getRange('B4').getValue();
    return email;
  }
  
  // Archive employee on Jibble
  function archiveEmployeeOnJibble(employeeId) {
    const token = getValidToken();
  
    if (!token) {
      Logger.log("Impossible de récupérer un token valide pour Jibble.");
      return;
    }
  
    const apiUrl = `https://workspace.prod.jibble.io/v1/People(${employeeId})`;
    const options = {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify({
        status: "Removed"
      }),
      muteHttpExceptions: true
    };
  
    try {
      const response = UrlFetchApp.fetch(apiUrl, options);
      const responseCode = response.getResponseCode();
  
      if (responseCode === 200 || responseCode === 204) {
        Logger.log(`Employé ${employeeId} archivé avec succès sur Jibble.`);
      } else {
        Logger.log(`Erreur lors de l'archivage de l'employé ${employeeId} : ${responseCode} - ${response.getContentText()}`);
      }
    } catch (e) {
      Logger.log(`Erreur lors de la requête d'archivage pour l'employé ${employeeId} : ${e.message}`);
    }
  
      // Update employee sheet
    updateEmployeeSheet(employeeId);
  }
  