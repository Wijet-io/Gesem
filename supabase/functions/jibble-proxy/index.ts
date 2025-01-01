import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer la configuration Jibble
    const { data: settings } = await fetch(
      'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings?key=eq.jibble_config&select=value',
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        }
      }
    ).then(r => r.json());

    if (!settings?.[0]?.value) {
      throw new Error('Configuration Jibble introuvable');
    }

    const config = settings[0].value;

    // Récupérer les paramètres de la requête
    const { endpoint, params } = await req.json();

    // Obtenir le token d'accès
    const tokenResponse = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.api_key,
        client_secret: config.api_secret
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Échec de l\'authentification Jibble');
    }

    const { access_token } = await tokenResponse.json();

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
      throw new Error(`Erreur API Jibble: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erreur Jibble proxy:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});