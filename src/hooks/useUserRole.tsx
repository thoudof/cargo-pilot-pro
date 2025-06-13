
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fetchedRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUserRoles = useCallback(async (userId: string) => {
    // Предотвращаем повторные запросы для того же пользователя
    if (fetchedRef.current === userId) {
      return;
    }

    console.log('useUserRole: Fetching roles for user:', userId);
    setLoading(true);
    fetchedRef.current = userId;

    try {
      const { data, error } = await supabase.rpc('get_user_roles', {
        _user_id: userId
      });

      if (!mountedRef.current) return;

      if (error) {
        console.error('useUserRole: Error fetching user roles:', error);
        setUserRoles([]);
      } else {
        console.log('useUserRole: Roles fetched successfully:', data);
        setUserRoles(data || []);
      }
    } catch (error) {
      if (!mountedRef.current) return;
      console.error('useUserRole: Exception fetching user roles:', error);
      setUserRoles([]);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!user?.id) {
      console.log('useUserRole: No user, clearing roles');
      setUserRoles([]);
      setLoading(false);
      fetchedRef.current = null;
      return;
    }

    // Если уже загружали для этого пользователя, не перезагружаем
    if (fetchedRef.current !== user.id) {
      fetchUserRoles(user.id);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, fetchUserRoles]);

  const roleFlags = {
    isAdmin: userRoles.includes('admin'),
    isDispatcher: userRoles.includes('dispatcher'),
    isDriver: userRoles.includes('driver'),
  };

  return {
    userRoles,
    ...roleFlags,
    loading
  };
};
