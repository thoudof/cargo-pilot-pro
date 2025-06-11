
import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  console.log('AdminRoute: Current state', { 
    user: !!user, 
    authLoading, 
    roleLoading, 
    isAdmin 
  });

  // Если аутентификация загружается, показываем загрузку
  if (authLoading) {
    console.log('AdminRoute: Auth loading, showing spinner');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если пользователя нет, возвращаем null (будет обработано в Index.tsx)
  if (!user) {
    console.log('AdminRoute: No user, returning null');
    return null;
  }

  // Если роли загружаются, показываем загрузку
  if (roleLoading) {
    console.log('AdminRoute: Roles loading, showing spinner');
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Если пользователь не администратор
  if (!isAdmin) {
    console.log('AdminRoute: User is not admin, showing access denied');
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Доступ запрещен
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              У вас нет прав администратора для доступа к этой странице.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('AdminRoute: User is admin, rendering children');
  return <>{children}</>;
};
