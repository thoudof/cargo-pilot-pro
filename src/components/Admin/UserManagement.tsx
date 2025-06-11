
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Edit, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserDetailsDialog } from './UserDetailsDialog';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  roles: UserRole[];
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = (profiles || []).map(profile => {
        const roles = userRoles?.filter(ur => ur.user_id === profile.id).map(ur => ur.role) || [];
        return {
          ...profile,
          username: profile.username || profile.id,
          roles
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить пользователей",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      // Удаляем роли пользователя
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Удаляем профиль пользователя
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Пользователь удален"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить пользователя",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'dispatcher': return 'default';
      case 'driver': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'dispatcher': return 'Диспетчер';
      case 'driver': return 'Водитель';
      default: return role || 'Не указано';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Управление пользователями
          </CardTitle>
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить пользователя
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Email/Логин</TableHead>
                <TableHead>Имя</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-xs">
                    {user.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.username || 'Не указан'}
                  </TableCell>
                  <TableCell>{user.full_name || 'Не указано'}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <UserDetailsDialog user={user} onUserUpdated={fetchUsers}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </UserDetailsDialog>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => deleteUser(user.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Пользователи не найдены
          </div>
        )}
      </CardContent>
    </Card>
  );
};
