
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRoles = async () => {
      // Если аутентификация еще загружается, подождем
      if (authLoading) {
        return;
      }

      // Если пользователя нет, очистим роли и установим loading в false
      if (!user?.id) {
        setUserRoles([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_user_roles', {
          _user_id: user.id
        });

        if (error) {
          console.error('Error fetching user roles:', error);
          setUserRoles([]);
        } else {
          setUserRoles(data || []);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
        setUserRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoles();
  }, [user?.id, authLoading]);

  const isAdmin = userRoles.includes('admin');
  const isDispatcher = userRoles.includes('dispatcher');
  const isDriver = userRoles.includes('driver');

  return {
    userRoles,
    isAdmin,
    isDispatcher,
    isDriver,
    loading: authLoading || loading
  };
};
