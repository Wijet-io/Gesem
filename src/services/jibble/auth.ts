import { supabase } from '../../lib/supabase';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getJibbleToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5 min margin)
  if (tokenCache && now < tokenCache.expiresAt - 300000) {
    return tokenCache.token;
  }

  // Get Jibble credentials from settings
  const { data: configData, error: configError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'jibble_config')
    .single();

  if (configError) throw configError;
  
  const { apiKey, apiSecret } = configData.value;

  // Request new token
  const response = await fetch('https://identity.prod.jibble.io/connect/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
      'client_id': apiKey,
      'client_secret': apiSecret
    })
  });

  if (!response.ok) {
    throw new Error('Failed to get Jibble token');
  }

  const data = await response.json();
  
  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in * 1000)
  };

  return data.access_token;
}