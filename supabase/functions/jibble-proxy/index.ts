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
    // Log pour debug
    console.log('Fetching Jibble config...');

    const { data: settings, error } = await fetch(
      'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings?select=*&key=eq.jibble_config',
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    ).then(r => r.json());

    console.log('Settings response:', settings);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!settings || settings.length === 0) {
      throw new Error('No Jibble config found');
    }

    const config = settings[0].value;
    console.log('Found config:', config);

    // Construction de la requête vers Jibble
    const formData = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.api_key,
      client_secret: config.api_secret,
    });

    // Appel à l'API Jibble
    const response = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jibble API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Retour du token
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Proxy error:', error);
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