import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface JibbleState {
  token: string | null;
  expiresAt: number | null;
  getToken: () => Promise<string>;
}

export const useJibbleStore = create<JibbleState>((set, get) => ({
  token: null,
  expiresAt: null,

  getToken: async () => {
    const state = get();
    const now = Date.now();

    // Return cached token if still valid (with 5 min margin)
    if (state.token && state.expiresAt && now < state.expiresAt - 300000) {
      return state.token;
    }

    // Get Jibble config from settings
    const { data: configData, error: configError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'jibble_config')
      .single();

    if (configError) throw configError;
    
    const config = configData.value;

    // Request new token
    const response = await fetch('https://identity.prod.jibble.io/connect/token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': config.apiKey,
        'client_secret': config.apiSecret
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get Jibble token');
    }

    const data = await response.json();
    
    set({
      token: data.access_token,
      expiresAt: now + (data.expires_in * 1000)
    });

    return data.access_token;
  }
}));