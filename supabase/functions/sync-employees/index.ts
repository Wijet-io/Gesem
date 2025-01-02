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
    // Client Supabase avec service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer les employés de Jibble via la fonction existante
    const jibbleResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/jibble-proxy`, {
      headers: {
        Authorization: `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
    });

    if (!jibbleResponse.ok) {
      const errorText = await jibbleResponse.text();
      throw new Error(`Failed to fetch employees from Jibble: ${errorText}`);
    }

    const jibbleData = await jibbleResponse.json();
    const jibbleEmployees = jibbleData.value;
    
    if (!Array.isArray(jibbleEmployees) || !jibbleEmployees.length) {
      throw new Error('No employees received from Jibble');
    }

    let syncedCount = 0;
    const errors = [];
    
    // Créer un Set des IDs des employés actifs de Jibble
    const activeEmployeeIds = new Set(jibbleEmployees.map(emp => emp.id));

    // 1. Supprimer les employés qui ne sont plus dans Jibble
    const { error: deleteError } = await supabaseAdmin
      .from('employees')
      .delete()
      .not('id', 'in', `(${Array.from(activeEmployeeIds).map(id => `'${id}'`).join(',')})`);

    if (deleteError) {
      errors.push(`Failed to remove inactive employees: ${deleteError.message}`);
    }

    // 2. Mettre à jour ou créer les employés
    for (const jibbleEmployee of jibbleEmployees) {
      const [firstName, ...lastNameParts] = jibbleEmployee.fullName.split(' ');
      const lastName = lastNameParts.join(' ');

      try {
        const { data: existingEmployee } = await supabaseAdmin
          .from('employees')
          .select('*')
          .eq('id', jibbleEmployee.id)
          .maybeSingle();

        if (!existingEmployee) {
          const { error: insertError } = await supabaseAdmin
            .from('employees')
            .insert({
              id: jibbleEmployee.id,
              first_name: firstName,
              last_name: lastName,
              normal_rate: 0,
              extra_rate: 0,
              min_hours: 8
            });

          if (insertError) {
            errors.push(`Failed to insert employee ${jibbleEmployee.fullName}: ${insertError.message}`);
            continue;
          }
        } else {
          const { error: updateError } = await supabaseAdmin
            .from('employees')
            .update({
              first_name: firstName,
              last_name: lastName
            })
            .eq('id', jibbleEmployee.id);

          if (updateError) {
            errors.push(`Failed to update employee ${jibbleEmployee.fullName}: ${updateError.message}`);
            continue;
          }
        }
        syncedCount++;
      } catch (error) {
        errors.push(`Error processing employee ${jibbleEmployee.fullName}: ${error.message}`);
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