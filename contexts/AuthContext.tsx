import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { USE_SUPABASE } from '../constants/features';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const [AuthProvider, useAuth] = createContextHook<AuthState>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!USE_SUPABASE) {
      console.log('[Auth] Supabase disabled - using local-only mode');
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error('Failed to get session:', error);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, email')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: userId,
          email: data.email,
          username: data.username,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    if (!USE_SUPABASE) {
      throw new Error('Authentication is disabled in offline mode');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await loadUserProfile(data.user.id);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    if (!USE_SUPABASE) {
      throw new Error('Authentication is disabled in offline mode');
    }

    try {
      console.log('Starting registration for:', email, username);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) {
        console.error('Supabase auth signUp error:', error);
        throw error;
      }

      console.log('Auth user created:', data.user?.id);

      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await loadUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!USE_SUPABASE) {
      return;
    }

    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    user,
    session,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!session,
  };
});
