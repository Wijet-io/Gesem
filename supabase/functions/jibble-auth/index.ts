import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const JIBBLE_AUTH_URL = 'https://identity.prod.jibble.io/connect/token';

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
    const { action } = await req.json();
    
    if (action !== 'getToken') {
      return new Response('Invalid action', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const apiKey = Deno.env.get('JIBBLE_API_KEY');
    const apiSecret = Deno.env.get('JIBBLE_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Missing Jibble API credentials');
    }

    const response = await fetch(JIBBLE_AUTH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: apiSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Jibble token');
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  } catch (error) {
    console.error('Auth function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  }
});