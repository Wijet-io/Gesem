import { JibblePerson } from './types';
import { supabase } from '../../lib/supabase';

export async function getEmployees(): Promise<JibblePerson[]> {
  console.log('Getting employees...');
  
  try {
    const { data, error } = await supabase.functions.invoke('jibble-proxy');
    
    console.log('Response from Edge Function:', { hasData: !!data, error });

    if (error) {
      console.error('Error from Edge Function:', error);
      throw error;
    }

    if (!data || !data.value) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from Jibble API');
    }

    // Filtrage comme dans le code GAS
    return data.value.filter(emp => emp.status === "Joined" && emp.role !== "Owner");
    
  } catch (error) {
    console.error('getEmployees error:', error);
    throw error;
  }
}