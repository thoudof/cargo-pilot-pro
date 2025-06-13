
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { activityLogger } from '@/services/activityLogger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      await activityLogger.logLogout();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    console.log('AuthProvider: Initializing auth...');
    
    // Получаем текущую сессию
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        } else {
          console.log('AuthProvider: Initial session:', !!session);
          setSession(session);
          setUser(session?.user ?? null);
          
          // Логируем успешную аутентификацию при инициализации
          if (session?.user) {
            await activityLogger.logLogin('session_restore');
          }
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Логируем события аутентификации
        if (event === 'SIGNED_IN' && session?.user) {
          await activityLogger.logLogin('password');
        } else if (event === 'SIGNED_OUT') {
          await activityLogger.logLogout();
        }
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up...');
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signOut
  }), [user, session, loading, signOut]);

  console.log('AuthProvider: Current state:', { user: !!user, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
