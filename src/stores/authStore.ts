import { create } from 'zustand';
import { User } from '../types/user';
import { supabase } from '../lib/supabase';
import { syncEmployeesFromJibble } from '../services/employee/syncService';

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

        set({ user: userData, loading: false, initialized: true });
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Récupérer les données utilisateur
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!userData) throw new Error('User data not found');

      set({ user: userData });
      set({ loading: false });
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