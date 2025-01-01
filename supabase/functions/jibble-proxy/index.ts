import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  console.log('Edge Function started');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log the request body before parsing
    const bodyText = await req.text();
    console.log('Raw request body:', bodyText);

    // Parse the body only if it's not empty
    if (!bodyText) {
      throw new Error('Request body is empty');
    }

    const { endpoint, params } = JSON.parse(bodyText);
    console.log('Parsed request:', { endpoint, params });

    console.log('Fetching settings...');
    const settingsResponse = await fetch(
      'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings?key=eq.jibble_config',
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );

    console.log('Settings response status:', settingsResponse.status);
    const settings = await settingsResponse.json();
    console.log('Settings data:', settings);

    if (!settings || settings.length === 0) {
      throw new Error('No Jibble config found');
    }

    const config = settings[0].value;
    console.log('Got Jibble config, requesting token...');

    // Get Jibble token first
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
      const errorText = await tokenResponse.text();
      throw new Error(`Jibble token error: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Got Jibble token, calling API...');

    // Now call the actual Jibble API
    const apiUrl = new URL(endpoint, 'https://workspace.prod.jibble.io/v1');
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        apiUrl.searchParams.append(key, String(value));
      });
    }

    console.log('Calling Jibble API at:', apiUrl.toString());
    const apiResponse = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Jibble API error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    console.log('API call successful');
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      type: error.constructor.name
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