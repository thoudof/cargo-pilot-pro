
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true
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
      (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, !!session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log('AuthProvider: Cleaning up...');
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading
  };

  console.log('AuthProvider: Current state:', { user: !!user, loading });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
