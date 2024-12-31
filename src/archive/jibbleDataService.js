// Fonction pour récupérer les employés depuis Jibble
function fetchEmployeesFromJibble() {
    var token = getValidToken();
    if (!token) {
      Logger.log("Impossible de récupérer le token.");
      return null;
    }
  
    var apiUrl = "https://workspace.prod.jibble.io/v1/People";
    var headers = {
      "Authorization": "Bearer " + token,
      "Accept": "application/json"
    };
    var options = {
      "method": "GET",
      "headers": headers,
      "muteHttpExceptions": true
    };
  
    try {
      var response = UrlFetchApp.fetch(apiUrl, options);
      var responseCode = response.getResponseCode();
  
      if (responseCode !== 200) {
        Logger.log("Erreur " + responseCode + ": " + response.getContentText());
        return null;
      }
  
      var data = JSON.parse(response.getContentText());
      var employees = data.value;
  
      employees.forEach(function(emp) {
        Logger.log("Nom: " + emp.fullName + ", Email: " + emp.email + ", Statut: " + emp.status);
      });
  
      return employees;
    } catch (e) {
      Logger.log("Erreur lors de la récupération des employés : " + e.toString());
      return null;
    }
  }
  
  // Fonction pour récupérer les données de pointage depuis Jibble
  function fetchAttendance(url) {
    var token = getValidToken(); // Récupérer le token d'accès
  
    if (!token) {
      Logger.log("Impossible de récupérer le token.");
      return null;
    }
  
    var headers = {
      "Authorization": "Bearer " + token, // Inclure le token dans l'en-tête
      "Accept": "application/json"
    };
  
    var options = {
      "method": "GET",
      "headers": headers,
      "muteHttpExceptions": true
    };
  
    try {
      var response = UrlFetchApp.fetch(url, options); // Effectuer la requête à l'API
      var responseCode = response.getResponseCode();
  
      if (responseCode === 401 || responseCode === 403) {
        // Si la réponse est 401 ou 403, cela signifie que le token a expiré ou est invalide.
        Logger.log("Token expiré ou invalide, régénération d'un nouveau token...");
        token = requestNewToken(); // Re-demander un nouveau token
        if (!token) {
          Logger.log("Impossible de régénérer un nouveau token.");
          return null;
        }
  
        // Réessayer la requête avec le nouveau token
        headers["Authorization"] = "Bearer " + token;
        response = UrlFetchApp.fetch(url, options); // Refaire la requête avec le nouveau token
        responseCode = response.getResponseCode();
      }
  
      if (responseCode !== 200) {
        Logger.log("Erreur " + responseCode + ": " + response.getContentText());
        return null; // Retourner null si la requête échoue
      }
  
      return JSON.parse(response.getContentText()); // Retourner la réponse JSON
    } catch (e) {
      Logger.log("Erreur lors de la récupération des données de pointage : " + e.toString());
      return null;
    }
  }