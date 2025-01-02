import { supabase } from '../../lib/supabase';

interface SyncResponse {
  data: {
    syncedCount: number;
    errors?: string[];
  };
  error: null | {
    message: string;
  };
}

export async function syncEmployeesFromJibble() {
  try {
    const { data, error } = await supabase.functions.invoke<SyncResponse['data']>('sync-employees');

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