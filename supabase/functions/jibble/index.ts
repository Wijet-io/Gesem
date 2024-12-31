import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { JIBBLE_CONFIG } from './config.ts';
import { getToken } from './token.ts';

// Ajout des headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Accept',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { endpoint, params } = await req.json();
    
    if (!endpoint) {
      return new Response('Missing endpoint', { 
        status: 400,
        headers: corsHeaders  // Ajout des headers CORS
      });
    }

    const token = await getToken();
    const url = new URL(endpoint, JIBBLE_CONFIG.API_BASE);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Jibble API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,  // Ajout des headers CORS
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Jibble function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,  // Ajout des headers CORS
        'Content-Type': 'application/json'
      }
    });
  }
});