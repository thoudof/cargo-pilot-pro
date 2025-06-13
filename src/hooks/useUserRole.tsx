
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserRoles = useCallback(async (userId: string) => {
    console.log('useUserRole: Fetching roles for user:', userId);
    setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: userId
      });

      if (error) {
        console.error('useUserRole: Error fetching user roles:', error);
        setUserRoles([]);
      } else {
        console.log('useUserRole: Roles fetched successfully:', data);
        setUserRoles(data || []);
      }
    } catch (error) {
      console.error('useUserRole: Exception fetching user roles:', error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) {
      console.log('useUserRole: No user, clearing roles');
      setUserRoles([]);
      setLoading(false);
      return;
    }

    fetchUserRoles(user.id);
  }, [user?.id, fetchUserRoles]);

  const roleFlags = useMemo(() => ({
    isAdmin: userRoles.includes('admin'),
    isDispatcher: userRoles.includes('dispatcher'),
    isDriver: userRoles.includes('driver'),
  }), [userRoles]);

  console.log('useUserRole: Current state', { 
    userRoles, 
    ...roleFlags,
    loading,
    userId: user?.id 
  });

  return {
    userRoles,
    ...roleFlags,
    loading
  };
};
