import { supabase } from '../../lib/supabase';
import { User } from '../../types/domain/user';

export async function updateProfile(userId: string, updates: {
  firstName?: string;
  lastName?: string;
}) {
  const mappedUpdates = {
    first_name: updates.firstName,
    last_name: updates.lastName
  };

  const { data, error } = await supabase
    .from('users')
    .update(mappedUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    firstName: data.first_name,
    lastName: data.last_name,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  } as User;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
}