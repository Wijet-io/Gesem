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
    console.log('Checking env variables:', {
      hasAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY')
    });

    // Essayons d'abord de récupérer toutes les entrées de la table settings
    const settingsResponse = await fetch(
      'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings',
      {
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Settings response status:', settingsResponse.status);
    
    // Log le texte brut de la réponse
    const responseText = await settingsResponse.text();
    console.log('Raw response:', responseText);

    // Essayer de parser le JSON
    const settings = responseText ? JSON.parse(responseText) : null;
    console.log('Parsed settings:', settings);

    // Log toutes les clés trouvées
    if (settings && Array.isArray(settings)) {
      console.log('Found settings keys:', settings.map(s => s.key));
    }

    const jibbleConfig = settings?.find(s => s.key === 'jibble_config');
    console.log('Found Jibble config:', jibbleConfig);

    if (!jibbleConfig) {
      throw new Error('No Jibble config found in settings table');
    }

    return new Response(JSON.stringify({
      message: 'Settings retrieved successfully',
      config: jibbleConfig
    }), {
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
      details: {
        stack: error.stack,
        type: error.constructor.name
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