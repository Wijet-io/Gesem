import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  console.log('Edge Function started');

  try {
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    console.log('Has anon key:', !!anonKey);

    // Test de connexion à Supabase avec plus de détails
    const testUrl = 'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings';
    console.log('Requesting URL:', testUrl);

    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey || '',
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    console.log('Response status:', testResponse.status);
    console.log('Response headers:', Object.fromEntries(testResponse.headers));

    const responseBody = await testResponse.text();
    console.log('Response body:', responseBody);

    // Si le status n'est pas 200, c'est probablement un problème de permissions
    if (testResponse.status !== 200) {
      return new Response(JSON.stringify({
        error: 'Failed to access settings table',
        status: testResponse.status,
        body: responseBody,
        message: 'This might be a permissions issue. Check the RLS policies for the settings table.'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    let settings;
    try {
      settings = JSON.parse(responseBody);
      console.log('Parsed settings:', settings);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      return new Response(JSON.stringify({
        error: 'Failed to parse settings',
        raw: responseBody
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const jibbleConfig = Array.isArray(settings) ? 
      settings.find(s => s.key === 'jibble_config') : null;

    if (!jibbleConfig) {
      return new Response(JSON.stringify({
        error: 'Jibble config not found',
        availableSettings: settings
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      message: 'Settings found',
      config: jibbleConfig
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    return new Response(JSON.stringify({
      error: error.message,
      details: {
        stack: error.stack,
        name: error.name
      }
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});