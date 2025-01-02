import { supabase } from '../../lib/supabase';

interface SyncResponse {
  syncedCount: number;
  errors?: string[];
}

export async function syncEmployeesFromJibble() {
  try {
    const { data, error } = await supabase.functions.invoke<SyncResponse>('sync-employees');

    if (error) {
      throw new Error(`Function invocation failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data received from sync function');
    }

    return data.syncedCount || 0;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error instanceof Error ? error : new Error('Failed to synchronize employees');
  }
}