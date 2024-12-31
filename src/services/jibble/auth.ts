import { supabase } from '../../lib/supabase';

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getJibbleToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5 min margin)
  if (tokenCache && now < tokenCache.expiresAt - 300000) {
    return tokenCache.token;
  }

  const { data, error } = await supabase.functions.invoke<TokenResponse>('jibble-auth', {
    body: { action: 'getToken' }
  });

  if (error) throw error;

  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in * 1000)
  };

  return data.access_token;
}