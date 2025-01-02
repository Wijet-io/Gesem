import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  console.log('Edge Function started');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Obtenir les credentials
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
    console.log('Settings retrieved:', settings.length > 0);
    const config = settings[0].value;

    // 2. Authentification
    const tokenResponse = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: config.api_key,
        client_secret: config.api_secret,
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token error: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token obtained');

    // 3. Récupérer les employés (en suivant exactement la structure GAS)
    const employeesResponse = await fetch('https://workspace.prod.jibble.io/v1/People', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!employeesResponse.ok) {
      throw new Error(`Jibble API error: ${employeesResponse.status}`);
    }

    const data = await employeesResponse.json();
    console.log('Employees retrieved:', data.value?.length || 0);

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});