import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  console.log('Edge Function started');

  try {
    // Test de connexion à Supabase
    const testResponse = await fetch(
      'https://ctxhclytfrnpacrknprk.supabase.co/rest/v1/settings',
      {
        method: 'GET',
        headers: {
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Test response status:', testResponse.status);
    console.log('Test response headers:', Object.fromEntries(testResponse.headers));
    
    const responseText = await testResponse.text();
    console.log('Raw response text:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response:', responseData);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }

    // Si on n'a pas de données, retourner une erreur explicite
    if (!responseData || !Array.isArray(responseData) || responseData.length === 0) {
      return new Response(JSON.stringify({
        error: 'No settings found',
        responseStatus: testResponse.status,
        rawResponse: responseText
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Retourner les données trouvées pour debug
    return new Response(JSON.stringify({
      message: 'Settings found',
      data: responseData
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