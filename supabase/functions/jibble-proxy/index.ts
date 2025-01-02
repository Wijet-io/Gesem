import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer la configuration Jibble
    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'jibble_config')
      .single();

    if (settingsError || !settingsData) {
      throw new Error('Failed to get Jibble configuration');
    }

    const jibbleConfig = settingsData.value;

    // Obtenir le token Jibble
    const tokenResponse = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: jibbleConfig.api_key,
        client_secret: jibbleConfig.api_secret,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get Jibble token');
    }

    const { access_token } = await tokenResponse.json();

    // Récupérer le body de la requête s'il existe
    let requestBody;
    if (req.body) {
      requestBody = await req.json();
    }

    // Construire l'URL de l'API Jibble
    let url = 'https://workspace.prod.jibble.io/v1/People';
    if (requestBody?.endpoint) {
      url = `https://workspace.prod.jibble.io/v1${requestBody.endpoint}`;
    }

    // Ajouter les paramètres de requête s'ils existent
    if (requestBody?.params) {
      const searchParams = new URLSearchParams(requestBody.params);
      url += `?${searchParams.toString()}`;
    }

    // Faire la requête à l'API Jibble
    const jibbleResponse = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!jibbleResponse.ok) {
      throw new Error(`Jibble API error: ${jibbleResponse.statusText}`);
    }

    const data = await jibbleResponse.json();

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});