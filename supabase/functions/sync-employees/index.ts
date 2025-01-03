import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

interface JibbleEmployee {
  id: string;
  fullName: string;
  status: string;
  role: string;
}

interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          normal_rate: number | null;
          extra_rate: number | null;
          min_hours: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name: string;
          normal_rate: number;
          extra_rate: number;
          min_hours: number;
        };
        Update: Partial<Database['public']['Tables']['employees']['Insert']>;
      };
    };
  };
}

type SupabaseClient = ReturnType<typeof createClient<Database>>;
type Employee = Database['public']['Tables']['employees']['Row'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    // Vérifier l'authentification JWT
    const jwt = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: 'No JWT provided' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client Supabase avec service role
    const supabaseAdmin = createClient<Database>(
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

    const { value: jibbleEmployees }: { value: JibbleEmployee[] } = await employeesResponse.json();
    
    if (!Array.isArray(jibbleEmployees)) {
      throw new Error('Invalid response from Jibble API');
    }

    const activeEmployees = jibbleEmployees.filter(emp => 
      emp.status === "Joined" && emp.role !== "Owner"
    );
    
    // Récupérer les données existantes de tous les employés
    const { data: existingEmployees } = await supabaseAdmin
      .from('employees')
      .select('id, normal_rate, extra_rate, min_hours')
      .returns<Employee[]>();

    const existingEmployeesMap = new Map(
      (existingEmployees || []).map(emp => [emp.id, emp])
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

      const existing = existingEmployeesMap.get(employee.id) || {
        normal_rate: 0,
        extra_rate: 0,
        min_hours: 8
      };

      try {
        const { error: upsertError } = await supabaseAdmin
          .from('employees')
          .upsert({
            id: employee.id,
            first_name: firstName,
            last_name: lastName,
            normal_rate: existingEmployees.normal_rate,
            extra_rate: existingEmployees.extra_rate,
            min_hours: existingEmployees.min_hours
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