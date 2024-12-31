import { serve } from 'https://deno.fresh.dev/std@v1/http/server.ts';

import { JIBBLE_CONFIG } from './config.ts';
import { getToken } from './token.ts';

serve(async (req) => {
  try {
    const { endpoint, params } = await req.json();
    
    if (!endpoint) {
      return new Response('Missing endpoint', { status: 400 });
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
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Jibble function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});