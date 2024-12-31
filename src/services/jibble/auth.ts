import { supabase } from '../../lib/supabase';

interface TokenCache {
  token: string;
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

let tokenCache: TokenCache | null = null;

export async function getJibbleToken(): Promise<string> {
  const now = Date.now();

  // Return cached token if still valid (with 5 min margin)
  if (tokenCache && now < tokenCache.expiresAt - 300000) {
    return tokenCache.token;
  }

  try {
    // Appel à notre fonction Edge
    const { data, error } = await supabase.functions.invoke<TokenResponse>('jibble-proxy');

    if (error) throw error;
    if (!data) throw new Error('No token data received');

    tokenCache = {
      token: data.access_token,
      expiresAt: now + (data.expires_in * 1000)
    };

    return data.access_token;
  } catch (error) {
    console.error('Failed to get Jibble token:', error);
    throw new Error('Failed to get Jibble token');
  }
}