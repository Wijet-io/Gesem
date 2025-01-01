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
    console.log('Edge Function started');
    const { endpoint, params } = await req.json();
    console.log('Request:', { endpoint, params });

    // 1. Récupérer les credentials Jibble
    const settingsResponse = await fetch(
      'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings?key=eq.jibble_config',
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const settings = await settingsResponse.json();
    const config = settings[0].value;

    // 2. Obtenir le token Jibble
    const tokenResponse = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.api_key,
        client_secret: config.api_secret,
      })
    });

    const tokenData = await tokenResponse.json();
    
    // 3. Appeler l'API Jibble avec le token
    const apiUrl = new URL(endpoint, 'https://workspace.prod.jibble.io/v1');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, String(value));
      });
    }

    console.log('Calling Jibble API:', apiUrl.toString());
    const apiResponse = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      throw new Error(`Jibble API error: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    console.log('API response:', data);

    // 4. Retourner les données
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});