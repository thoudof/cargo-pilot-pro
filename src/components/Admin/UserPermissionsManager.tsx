import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserWithPermissions {
  id: string;
  full_name: string | null;
  user_roles: Array<{ role: string }>;
  user_permissions: Array<{
    id: string;
    permission: string;
    created_at: string;
  }>;
}

const PERMISSION_LABELS: Record<string, string> = {
  view_trips: 'Просмотр рейсов',
  edit_trips: 'Редактирование рейсов',
  delete_trips: 'Удаление рейсов',
  view_contractors: 'Просмотр контрагентов',
  edit_contractors: 'Редактирование контрагентов',
  delete_contractors: 'Удаление контрагентов',
  view_drivers: 'Просмотр водителей',
  edit_drivers: 'Редактирование водителей',
  delete_drivers: 'Удаление водителей',
  view_vehicles: 'Просмотр транспорта',
  edit_vehicles: 'Редактирование транспорта',
  delete_vehicles: 'Удаление транспорта',
  view_routes: 'Просмотр маршрутов',
  edit_routes: 'Редактирование маршрутов',
  delete_routes: 'Удаление маршрутов',
  view_cargo_types: 'Просмотр типов грузов',
  edit_cargo_types: 'Редактирование типов грузов',
  delete_cargo_types: 'Удаление типов грузов',
  view_documents: 'Просмотр документов',
  edit_documents: 'Редактирование документов',
  delete_documents: 'Удаление документов',
  manage_document_templates: 'Управление шаблонами документов',
  view_expenses: 'Просмотр расходов',
  edit_expenses: 'Редактирование расходов',
  delete_expenses: 'Удаление расходов',
  view_reports: 'Просмотр отчетов',
  view_admin_panel: 'Доступ к админ-панели',
  view_finances: 'Просмотр финансов',
  view_statistics: 'Просмотр статистики',
  view_analytics: 'Просмотр аналитики',
  manage_users: 'Управление пользователями',
  manage_system: 'Управление системой',
  export_data: 'Экспорт данных',
};

export const UserPermissionsManager: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Получаем всех пользователей с их правами
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-permissions'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, full_name');

      if (error) throw error;

      // Получаем роли пользователей отдельно
      const userIds = profiles.map(u => u.id);
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Получаем права пользователей отдельно
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('id, user_id, permission, created_at')
        .in('user_id', userIds);

      // Объединяем данные
      return profiles.map(user => ({
        ...user,
        user_roles: (userRoles || []).filter(ur => ur.user_id === user.id),
        user_permissions: (userPermissions || []).filter(up => up.user_id === user.id)
      })) as UserWithPermissions[];
    },
  });

  // Мутация для добавления права
  const addPermissionMutation = useMutation({
    mutationFn: async (data: { userId: string; permission: string }) => {
      const { error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: data.userId,
          permission: data.permission as any,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-permissions'] });
      toast.success('Право успешно добавлено');
      setIsDialogOpen(false);
      setSelectedUser('');
      setSelectedPermission('');
    },
    onError: (error) => {
      toast.error(`Ошибка при добавлении права: ${error.message}`);
    },
  });

  // Мутация для удаления права
  const removePermissionMutation = useMutation({
    mutationFn: async (permissionId: string) => {
      const { error } = await supabase
        .from('user_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-permissions'] });
      toast.success('Право успешно удалено');
    },
    onError: (error) => {
      toast.error(`Ошибка при удалении права: ${error.message}`);
    },
  });

  const handleAddPermission = () => {
    if (!selectedUser || !selectedPermission) {
      toast.error('Выберите пользователя и право');
      return;
    }

    addPermissionMutation.mutate({
      userId: selectedUser,
      permission: selectedPermission,
    });
  };

  const getRolePermissions = (userRoles: Array<{ role: string }>) => {
    const rolePermissions: string[] = [];
    userRoles.forEach(ur => {
      switch (ur.role) {
        case 'admin':
          rolePermissions.push(...Object.keys(PERMISSION_LABELS));
          break;
        case 'dispatcher':
          rolePermissions.push(
            'view_trips', 'edit_trips', 'view_contractors', 'edit_contractors',
            'view_drivers', 'edit_drivers', 'view_vehicles', 'edit_vehicles',
            'view_routes', 'edit_routes', 'view_cargo_types', 'edit_cargo_types',
            'view_documents', 'edit_documents', 'view_expenses', 'edit_expenses',
            'view_reports', 'view_finances', 'view_statistics', 'view_analytics', 'export_data'
          );
          break;
        case 'driver':
          rolePermissions.push('view_trips', 'view_documents', 'view_expenses', 'view_routes');
          break;
      }
    });
    return [...new Set(rolePermissions)];
  };

  const getRoleBadge = (userRoles: Array<{ role: string }>) => {
    const roles = userRoles.map(ur => ur.role);
    if (roles.includes('admin')) return <Badge variant="destructive">Админ</Badge>;
    if (roles.includes('dispatcher')) return <Badge variant="default">Диспетчер</Badge>;
    if (roles.includes('driver')) return <Badge variant="secondary">Водитель</Badge>;
    return <Badge variant="outline">Без роли</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Управление правами пользователей</h2>
          <p className="text-muted-foreground">
            Добавление и удаление индивидуальных прав пользователей
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Добавить право
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить право пользователю</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Пользователь</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите пользователя" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || 'Без имени'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Право</Label>
                <Select value={selectedPermission} onValueChange={setSelectedPermission}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите право" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PERMISSION_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddPermission}
                disabled={addPermissionMutation.isPending}
                className="w-full"
              >
                {addPermissionMutation.isPending ? 'Добавление...' : 'Добавить право'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {users?.map((user) => {
          const rolePermissions = getRolePermissions(user.user_roles);

          return (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {user.full_name || 'Без имени'}
                  {getRoleBadge(user.user_roles)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Права по ролям */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Права по роли
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {rolePermissions.slice(0, 10).map((permission) => (
                        <Badge key={permission} variant="outline">
                          {PERMISSION_LABELS[permission] || permission}
                        </Badge>
                      ))}
                      {rolePermissions.length > 10 && (
                        <Badge variant="secondary">+{rolePermissions.length - 10} ещё</Badge>
                      )}
                    </div>
                  </div>

                  {/* Индивидуальные права */}
                  {user.user_permissions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Дополнительные права
                      </h4>
                      <div className="space-y-2">
                        {user.user_permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {PERMISSION_LABELS[permission.permission] || permission.permission}
                              </span>
                              <div className="text-sm text-muted-foreground">
                                Добавлено: {format(new Date(permission.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removePermissionMutation.mutate(permission.id)}
                              disabled={removePermissionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
