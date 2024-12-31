import { supabase } from '../../lib/supabase';
import { User, UserRole } from '../../types/user';
import { getCurrentUser } from './authService';

export async function createUser(email: string, password: string, role: UserRole, firstName: string, lastName: string) {
  // Vérifier que l'utilisateur courant est un admin
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== UserRole.ADMIN) {
    throw new Error('Unauthorized: Only administrators can create users');
  }

  // 1. Créer l'utilisateur dans Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirme l'email
  });

  if (authError) throw authError;

  // 2. Créer le profil utilisateur avec son rôle
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert([{
      id: authData.user.id,
      email,
      role,
      first_name: firstName,
      last_name: lastName
    }])
    .select()
    .single();

  if (userError) {
    // En cas d'erreur, on essaie de supprimer l'utilisateur Auth créé
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw userError;
  }

  return userData as User;
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function listUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      role,
      first_name,
      last_name,
      created_at,
      updated_at
    `)
    .order('last_name', { ascending: true });

  if (error) throw error;
  return data?.map(user => ({
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.first_name,
    lastName: user.last_name,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  })) || [];
}

export async function deleteUser(userId: string) {
  // 1. Supprimer le profil utilisateur
  const { error: userError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (userError) throw userError;

  // 2. Supprimer l'utilisateur de Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  
  if (authError) throw authError;
}