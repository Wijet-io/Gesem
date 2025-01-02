import { supabase } from '../../lib/supabase';

export async function syncEmployeesFromJibble() {
  try {
    const { data, error } = await supabase.functions.invoke('sync-employees', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (error) throw error;
    if (!data) throw new Error('No data received from sync function');

    return data.syncedCount;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error instanceof Error ? error : new Error('Failed to synchronize employees');
  }
}