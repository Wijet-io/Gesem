import { JIBBLE_CONFIG } from './config.ts';

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

export async function getToken(): Promise<string> {
  const now = Date.now();
  
  if (tokenCache && now < tokenCache.expiresAt - JIBBLE_CONFIG.TOKEN_MARGIN) {
    return tokenCache.token;
  }

  const response = await fetch(JIBBLE_CONFIG.AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getToken' })
  });

  if (!response.ok) {
    throw new Error('Failed to get token from auth service');
  }

  const { access_token, expires_in } = await response.json();
  
  tokenCache = {
    token: access_token,
    expiresAt: now + (expires_in * 1000)
  };

  return access_token;
}