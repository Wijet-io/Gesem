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
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Créer le client Supabase avec service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Vérifier le JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // 1. Obtenir les credentials Jibble
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'jibble_config')
      .single();

    if (!settings) throw new Error('No Jibble configuration found');
    const jibbleConfig = settings.value;

    // 2. Obtenir le token Jibble une seule fois
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

    const { access_token: jibbleToken } = await tokenResponse.json();

    // 3. Traiter la requête selon l'action
    const { action, params } = await req.json();

    let data;
    if (action === 'getEmployees') {
      const employeesResponse = await fetch('https://workspace.prod.jibble.io/v1/People', {
        headers: {
          'Authorization': `Bearer ${jibbleToken}`,
          'Accept': 'application/json'
        },
      });
      data = await employeesResponse.json();
    } else if (action === 'getTimesheets') {
      const queryParams = new URLSearchParams({
        period: params.period,
        date: params.date,
        endDate: params.endDate,
        personIds: params.personIds,
        $filter: params.filter
      });

      const timesheetsResponse = await fetch(
        `https://time-attendance.prod.jibble.io/v1/TimesheetsSummary?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${jibbleToken}`,
            'Accept': 'application/json'
          },
        }
      );
      data = await timesheetsResponse.json();
    } else {
      throw new Error('Invalid action');
    }

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