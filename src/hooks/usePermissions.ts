
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { AppPermission } from '@/types';

const fetchUserPermissions = async (userId: string | undefined): Promise<AppPermission[]> => {
  if (!userId) return [];

  // Получаем роли пользователя
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

  // Получаем права для этих ролей
  const { data: permissions, error: permissionsError } = await supabase
    .from('role_permissions')
    .select('permission')
    .in('role', roles);

  if (permissionsError) {
    console.error('Error fetching role permissions:', permissionsError);
    return [];
  }

  // Возвращаем уникальный список прав
  const uniquePermissions = [...new Set(permissions.map(p => p.permission))];
  return uniquePermissions as AppPermission[];
};

export const usePermissions = () => {
  const { user } = useAuth();

  const { data: permissions, isLoading, error, refetch } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: () => fetchUserPermissions(user?.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  const hasPermission = (permission: AppPermission) => {
    return permissions?.includes(permission) ?? false;
  };

  return { permissions: permissions ?? [], hasPermission, isLoading, error, refetch };
};
