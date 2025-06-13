
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setUserRoles([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);

    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_roles', {
          _user_id: user.id
        });

        if (mounted) {
          if (error) {
            console.error('Error fetching roles:', error);
            setUserRoles([]);
          } else {
            setUserRoles(data || []);
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Exception fetching roles:', error);
          setUserRoles([]);
          setLoading(false);
        }
      }
    };

    fetchRoles();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return {
    userRoles,
    isAdmin: userRoles.includes('admin'),
    isDispatcher: userRoles.includes('dispatcher'),
    isDriver: userRoles.includes('driver'),
    loading
  };
};
