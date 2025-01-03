import { supabase } from '../../lib/supabase';

interface SyncResult {
  syncedCount: number;
  errors?: string[];
}

export async function syncEmployeesFromJibble(): Promise<SyncResult> {
  console.log('Starting employee synchronization with Jibble...');

  try {
    const { data, error } = await supabase.functions.invoke('sync-employees', {
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw error;
    if (!data) throw new Error('No response from sync function');

    return data as SyncResult;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}