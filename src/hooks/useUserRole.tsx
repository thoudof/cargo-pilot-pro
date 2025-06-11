
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!user?.id) {
        console.log('useUserRole: No user, clearing roles');
        setUserRoles([]);
        setLoading(false);
        return;
      }

      console.log('useUserRole: Fetching roles for user:', user.id);
      setLoading(true);

      try {
        const { data, error } = await supabase.rpc('get_user_roles', {
          _user_id: user.id
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
    };

    fetchUserRoles();
  }, [user?.id]);

  const isAdmin = userRoles.includes('admin');
  const isDispatcher = userRoles.includes('dispatcher');
  const isDriver = userRoles.includes('driver');

  console.log('useUserRole: Current state', { 
    userRoles, 
    isAdmin, 
    isDispatcher, 
    isDriver, 
    loading,
    userId: user?.id 
  });

  return {
    userRoles,
    isAdmin,
    isDispatcher,
    isDriver,
    loading
  };
};
