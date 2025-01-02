import { supabase } from '../../lib/supabase';

export async function syncEmployeesFromJibble() {
  try {
    const { data, error } = await supabase.functions.invoke<{
      syncedCount: number;
      errors?: string[];
      error?: string;
    }>('sync-employees');
    
    if (error) {
      throw new Error(`Function invocation failed: ${error.message}`);
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    if (data.errors?.length > 0) {
      console.warn('Sync completed with warnings:', data.errors);
    }
    
    return data.syncedCount || 0;
  } catch (error: any) {
    console.error('Sync failed:', error);
    throw error instanceof Error ? error : new Error('Failed to synchronize employees');
  }
}