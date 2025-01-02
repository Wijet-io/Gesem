import { create } from 'zustand';
import { User } from '../types/user';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData) {
          set({
            user: {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              firstName: userData.first_name,
              lastName: userData.last_name,
              createdAt: userData.created_at,
              updatedAt: userData.updated_at
            },
            loading: false,
            initialized: true
          });
        } else {
          set({ user: null, loading: false, initialized: true });
        }
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, loading: false, initialized: true });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      
      // Vérifier si l'utilisateur n'est pas déjà connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        throw new Error('Une session est déjà active');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      // Vérifier que l'utilisateur existe dans notre table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        throw new Error('Compte utilisateur non trouvé');
      }

      set({
        user: {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          firstName: userData.first_name,
          lastName: userData.last_name,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at
        },
        loading: false
      });
    } catch (error) {
      console.error('Sign in error:', error);
      set({ loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ user: null, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  }
}));