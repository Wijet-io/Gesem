import { User, UserRole } from '../../types/domain/user';
import { supabase } from '../../lib/supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as User;
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roles = Object.values(UserRole);
  const userRoleIndex = roles.indexOf(userRole);
  const requiredRoleIndex = roles.indexOf(requiredRole);
  return userRoleIndex <= requiredRoleIndex;
}