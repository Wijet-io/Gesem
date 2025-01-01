import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer la configuration Jibble
    const { data: settings } = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/settings?key=eq.jibble_config&select=value`,
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        }
      }
    ).then(r => r.json());

    if (!settings?.[0]?.value) {
      throw new Error('Jibble configuration not found in settings table');
    }

    const config = settings[0].value;
    console.log('Config loaded:', { ...config, api_secret: '[REDACTED]' });

    // Récupérer les paramètres de la requête
    const { endpoint, params } = await req.json();
    console.log('Request params:', { endpoint, params });

    // Obtenir le token d'accès
    const tokenResponse = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.apiKey || config.api_key,
        client_secret: config.apiSecret || config.api_secret
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token response error:', error);
      throw new Error(`Jibble authentication failed: ${error}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('Token obtained successfully');

    // Construire l'URL de l'API avec les paramètres
    const apiUrl = new URL(`https://workspace.prod.jibble.io/v1${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, value as string);
      });
    }

    // Faire la requête à l'API Jibble
    const apiResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      const error = await apiResponse.text();
      console.error('API response error:', error);
      throw new Error(`Jibble API error (${apiResponse.status}): ${error}`);
    }

    const data = await apiResponse.json();
    console.log('API response:', data);

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erreur Jibble proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.stack : '';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});