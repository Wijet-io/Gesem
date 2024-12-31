import { Advance } from '../../types/advance';
import { supabase } from '../../lib/supabase';

export async function getAdvances(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('advances')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data as Advance[];
}

export async function createAdvance(advance: Omit<Advance, 'id' | 'createdAt' | 'status'>) {
  const { data, error } = await supabase
    .from('advances')
    .insert([advance])
    .select()
    .single();

  if (error) throw error;
  return data as Advance;
}

export async function updateAdvanceStatus(id: string, status: 'APPROVED' | 'REJECTED', userId: string) {
  const { data, error } = await supabase
    .from('advances')
    .update({
      status,
      approved_by: userId,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Advance;
}