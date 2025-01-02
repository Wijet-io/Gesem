import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Client Supabase avec service role
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

    // Récupérer les employés de Jibble
    const employeesResponse = await fetch('https://workspace.prod.jibble.io/v1/People', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
      },
    });

    if (!employeesResponse.ok) {
      throw new Error('Failed to fetch employees from Jibble');
    }

    const { value: jibbleEmployees } = await employeesResponse.json();
    
    if (!Array.isArray(jibbleEmployees)) {
      throw new Error('Invalid response from Jibble API');
    }

    const activeEmployees = jibbleEmployees.filter(emp => 
      emp.status === "Joined" && emp.role !== "Owner"
    );

    let syncedCount = 0;
    const errors: string[] = [];

    // Créer un Set des IDs des employés actifs
    const activeEmployeeIds = new Set(activeEmployees.map(emp => emp.id));

    // Supprimer les employés inactifs
    const { error: deleteError } = await supabaseAdmin
      .from('employees')
      .delete()
      .not('id', 'in', Array.from(activeEmployeeIds));

    if (deleteError) {
      errors.push(`Failed to remove inactive employees: ${deleteError.message}`);
    }

    // Mettre à jour ou créer les employés
    for (const employee of activeEmployees) {
      const [firstName, ...lastNameParts] = employee.fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      try {
        const { error: upsertError } = await supabaseAdmin
          .from('employees')
          .upsert({
            id: employee.id,
            first_name: firstName,
            last_name: lastName,
            normal_rate: 0,
            extra_rate: 0,
            min_hours: 8
          });

        if (upsertError) {
          errors.push(`Failed to upsert employee ${employee.fullName}: ${upsertError.message}`);
          continue;
        }

        syncedCount++;
      } catch (error) {
        errors.push(`Error processing employee ${employee.fullName}: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({ syncedCount, errors }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: errors.length > 0 ? 207 : 200
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