import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, Shield, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UserWithPermissions {
  id: string;
  username: string;
  full_name: string;
  role: string;
  user_roles: Array<{ role: string }>;
  user_permissions: Array<{
    id: string;
    permission: string;
    granted_at: string;
    expires_at?: string;
  }>;
}

const PERMISSION_LABELS = {
  view_trips: 'Просмотр рейсов',
  edit_trips: 'Редактирование рейсов',
  view_contractors: 'Просмотр контрагентов',
  edit_contractors: 'Редактирование контрагентов',
  view_drivers: 'Просмотр водителей',
  edit_drivers: 'Редактирование водителей',
  view_vehicles: 'Просмотр транспорта',
  edit_vehicles: 'Редактирование транспорта',
  view_routes: 'Просмотр маршрутов',
  edit_routes: 'Редактирование маршрутов',
  view_cargo_types: 'Просмотр типов грузов',
  edit_cargo_types: 'Редактирование типов грузов',
  view_documents: 'Просмотр документов',
  edit_documents: 'Редактирование документов',
  manage_document_templates: 'Управление шаблонами документов',
  delete_documents: 'Удаление документов',
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
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Получаем всех пользователей с их правами
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          role
        `);

      if (error) throw error;

      // Получаем роли пользователей отдельно
      const userIds = data.map(u => u.id);
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Получаем права пользователей отдельно
      const { data: userPermissions } = await supabase
        .from('user_permissions')
        .select('id, user_id, permission, granted_at, expires_at')
        .in('user_id', userIds);

      // Объединяем данные
      return data.map(user => ({
        ...user,
        user_roles: (userRoles || []).filter(ur => ur.user_id === user.id),
        user_permissions: (userPermissions || []).filter(up => up.user_id === user.id)
      })) as UserWithPermissions[];
    },
  });

  // Мутация для добавления права
  const addPermissionMutation = useMutation({
    mutationFn: async (data: { userId: string; permission: string; expiresAt?: string }) => {
      const { error } = await supabase
        .from('user_permissions')
        .insert({
          user_id: data.userId,
          permission: data.permission as any,
          expires_at: data.expiresAt || null,
          granted_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-permissions'] });
      toast.success('Право успешно добавлено');
      setIsDialogOpen(false);
      setSelectedUser('');
      setSelectedPermission('');
      setExpiresAt('');
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
      expiresAt: expiresAt || undefined,
    });
  };

  const getRolePermissions = (userRoles: Array<{ role: string }>) => {
    // Здесь можно добавить логику для получения прав по ролям
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
          rolePermissions.push('view_trips', 'view_documents', 'edit_documents', 'view_expenses');
          break;
      }
    });
    return [...new Set(rolePermissions)];
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
                        {user.full_name || user.username} ({user.role})
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

              <div>
                <Label>Срок действия (необязательно)</Label>
                <Input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
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
          const activeUserPermissions = user.user_permissions.filter(
            p => !p.expires_at || new Date(p.expires_at) > new Date()
          );

          return (
            <Card key={user.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {user.full_name || user.username}
                  <Badge variant="secondary">{user.role}</Badge>
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
                      {rolePermissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {PERMISSION_LABELS[permission as keyof typeof PERMISSION_LABELS]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Индивидуальные права */}
                  {activeUserPermissions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Дополнительные права
                      </h4>
                      <div className="space-y-2">
                        {activeUserPermissions.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {PERMISSION_LABELS[permission.permission as keyof typeof PERMISSION_LABELS]}
                              </span>
                              <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Добавлено: {format(new Date(permission.granted_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                {permission.expires_at && (
                                  <>
                                    , истекает: {format(new Date(permission.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                  </>
                                )}
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