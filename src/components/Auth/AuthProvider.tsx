
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppPermission } from '@/types';

const fetchUserPermissions = async (userId: string | undefined): Promise<AppPermission[]> => {
  if (!userId) return [];

  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    return [];
  }

  const roles = userRoles.map(r => r.role);
  if (roles.length === 0) return [];

  const { data: permissions, error: permissionsError } = await supabase
    .from('role_permissions')
    .select('permission')
    .in('role', roles);

  if (permissionsError) {
    console.error('Error fetching role permissions:', permissionsError);
    return [];
  }

  const uniquePermissions = [...new Set(permissions.map(p => p.permission))];
  return uniquePermissions as AppPermission[];
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasPermission: (permission: AppPermission) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  hasPermission: () => false,
  isAdmin: false,
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
  const [authLoading, setAuthLoading] = useState(true);
  const queryClient = useQueryClient();

  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => fetchUserPermissions(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const hasPermission = (permission: AppPermission) => {
    return permissions?.includes(permission) ?? false;
  };

  const isAdmin = hasPermission(AppPermission.VIEW_ADMIN_PANEL);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      queryClient.clear();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  useEffect(() => {
    let mounted = true;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setAuthLoading(false);
        }
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setAuthLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setAuthLoading(false);

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
          }
          if (event === 'SIGNED_OUT') {
            queryClient.clear();
          }
        }
      }
    );

    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);
  
  const loading = authLoading || (!!user && permissionsLoading);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, hasPermission, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
