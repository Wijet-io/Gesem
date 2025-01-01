import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  console.log('Edge Function started', { method: req.method });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log raw request
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    // Parse body safely
    let body;
    try {
      body = rawBody ? JSON.parse(rawBody) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error(`Invalid JSON in request body: ${e.message}`);
    }

    const { endpoint = '/People', params = {} } = body;
    console.log('Parsed request:', { endpoint, params });

    // Fetch Jibble config
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

    console.log('Settings response status:', settingsResponse.status);
    const settings = await settingsResponse.json();
    console.log('Got settings:', settings);

    if (!settings || !settings.length) {
      throw new Error('No Jibble config found in settings');
    }

    const config = settings[0].value;

    // Get Jibble token
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

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get Jibble token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Got Jibble token');

    // Call Jibble API
    const apiUrl = new URL(endpoint, 'https://workspace.prod.jibble.io/v1');
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
    console.log('Got API response');

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Function error:', {
      message: error.message,
      stack: error.stack
    });

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