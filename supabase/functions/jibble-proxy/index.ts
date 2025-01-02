import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2';
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
    // Créer le client Supabase avec service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Obtenir les credentials Jibble
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'jibble_config')
      .single();

    if (!settings) throw new Error('No Jibble configuration found');

    // 2. Obtenir le token Jibble
    const tokenResponse = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: settings.value.api_key,
        client_secret: settings.value.api_secret,
      }),
    });

    const { access_token } = await tokenResponse.json();

    // 3. Obtenir les employés
    const employeesResponse = await fetch('https://workspace.prod.jibble.io/v1/People', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json'
      },
    });

    const data = await employeesResponse.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});