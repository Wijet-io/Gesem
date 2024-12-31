// Fonction pour récupérer un token valide avant chaque requête
function getValidToken() {
    var token = getAccessToken();  // Récupérer le token en cache
    if (!token) {
      Logger.log("Le token est expiré ou inexistant, demande d'un nouveau token...");
      token = requestNewToken();  // Récupérer un nouveau token si inexistant/expiré
    }
    return token;
  }
  
  function getAccessToken() {
    // Récupérer le token et son expiration depuis les propriétés
    var scriptProperties = PropertiesService.getScriptProperties();
    var token = scriptProperties.getProperty('ACCESS_TOKEN');
    var expirationTime = scriptProperties.getProperty('TOKEN_EXPIRATION');
  
    // Vérification si le token existe et n'est pas expiré
    if (token && expirationTime && new Date().getTime() < parseInt(expirationTime)) {
      Logger.log("Token récupéré depuis le cache.");
      return token;
    }
  
    // Si pas de token ou token expiré/invalide, en générer un nouveau
    return requestNewToken();
  }
  
  // Fonction pour générer un nouveau token
  function requestNewToken() {
    Logger.log("Le token est expiré ou inexistant, demande d'un nouveau token...");
    var scriptProperties = PropertiesService.getScriptProperties();
  
    var apiUrl = "https://identity.prod.jibble.io/connect/token";
    var options = {
      "method": "POST",
      "headers": {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      "payload": {
        "grant_type": "client_credentials",
        "client_id": scriptProperties.getProperty('API_KEY'),
        "client_secret": scriptProperties.getProperty('API_SECRET')
      },
      "muteHttpExceptions": true
    };
  
    try {
      var response = UrlFetchApp.fetch(apiUrl, options);
      var responseCode = response.getResponseCode();
      
      if (responseCode !== 200) {
        Logger.log("Erreur lors de la demande du token : " + responseCode + " - " + response.getContentText());
        throw new Error('Erreur lors de la récupération du token : ' + response.getContentText());
      }
  
      var data = JSON.parse(response.getContentText());
      var accessToken = data.access_token;
      var expiresIn = data.expires_in;  // Durée de validité du token en secondes
  
      // Calculer le temps d'expiration du token (temps actuel + durée du token en millisecondes)
      var expirationTime = new Date().getTime() + expiresIn * 1000;
  
      // Stocker le token et son expiration dans les propriétés
      scriptProperties.setProperty('ACCESS_TOKEN', accessToken);
      scriptProperties.setProperty('TOKEN_EXPIRATION', expirationTime.toString());
  
      Logger.log("Nouveau token généré et stocké.");
      return accessToken;
  
    } catch (e) {
      Logger.log("Erreur lors de la récupération du token : " + e.toString());
      return null;
    }
  }
  