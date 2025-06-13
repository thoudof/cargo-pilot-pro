
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  const [initialized, setInitialized] = useState(false);

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
    if (initialized) return; // Предотвращаем повторную инициализацию

    console.log('AuthProvider: Initializing auth...');
    
    let mounted = true;
    
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        } else {
          console.log('AuthProvider: Initial session:', !!session);
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              try {
                await activityLogger.logLogin('session_restore');
              } catch (logError) {
                console.warn('Failed to log session restore:', logError);
              }
            }
          }
        }
      } catch (error) {
        console.error('AuthProvider: Exception getting session:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state changed:', event, !!session);
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (initialized) { // Только если уже инициализированы
            setLoading(false);
          }

          try {
            if (event === 'SIGNED_IN' && session?.user) {
              await activityLogger.logLogin('password');
            } else if (event === 'SIGNED_OUT') {
              await activityLogger.logLogout();
            }
          } catch (logError) {
            console.warn('Failed to log auth event:', logError);
          }
        }
      }
    );

    return () => {
      mounted = false;
      console.log('AuthProvider: Cleaning up...');
      subscription.unsubscribe();
    };
  }, [initialized]);

  const value = {
    user,
    session,
    loading,
    signOut
  };

  console.log('AuthProvider: Current state:', { user: !!user, loading, initialized });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
