
import { useAuth } from '@/components/Auth/AuthProvider';
import { usePermissions } from './usePermissions';
import { AppPermission } from '@/types';

export const useUserRole = () => {
  const { loading: authLoading } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();

  const isAdmin = hasPermission(AppPermission.VIEW_ADMIN_PANEL);
  const loading = authLoading || permissionsLoading;

  return { isAdmin, loading };
};
