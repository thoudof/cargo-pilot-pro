
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, Activity, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['app_role'];

interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

interface UserDetailsDialogProps {
  user: UserProfile;
  onUserUpdated: () => void;
  children: React.ReactNode;
}

export const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  user,
  onUserUpdated,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user.username || '',
    full_name: user.full_name || '',
    role: user.role || 'dispatcher'
  });
  const [userStats, setUserStats] = useState({
    totalTrips: 0,
    totalContractors: 0,
    totalDrivers: 0,
    totalVehicles: 0,
    lastLogin: null as string | null,
    activityCount: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchUserStats();
    }
  }, [open, user.id]);

  const fetchUserStats = async () => {
    try {
      const [
        { count: tripsCount },
        { count: contractorsCount },
        { count: driversCount },
        { count: vehiclesCount },
        { count: activityCount },
        { data: lastActivity }
      ] = await Promise.all([
        supabase.from('trips').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('contractors').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('activity_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('activity_logs')
          .select('created_at')
          .eq('user_id', user.id)
          .eq('action', 'login')
          .order('created_at', { ascending: false })
          .limit(1)
      ]);

      setUserStats({
        totalTrips: tripsCount || 0,
        totalContractors: contractorsCount || 0,
        totalDrivers: driversCount || 0,
        totalVehicles: vehiclesCount || 0,
        lastLogin: lastActivity?.[0]?.created_at || null,
        activityCount: activityCount || 0
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Обновляем профиль
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
          role: formData.role
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Обновляем роли
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: formData.role as UserRole });

      if (roleError) throw roleError;

      toast({
        title: "Успешно",
        description: "Данные пользователя обновлены"
      });

      setOpen(false);
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные пользователя",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'dispatcher': return 'Диспетчер';
      case 'driver': return 'Водитель';
      default: return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Редактирование пользователя
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">Основное</TabsTrigger>
            <TabsTrigger value="stats">Статистика</TabsTrigger>
            <TabsTrigger value="activity">Активность</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email/Логин</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Полное имя</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="dispatcher">Диспетчер</SelectItem>
                  <SelectItem value="driver">Водитель</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата регистрации</Label>
                <div className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleString('ru-RU')}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Последнее обновление</Label>
                <div className="text-sm text-muted-foreground">
                  {new Date(user.updated_at).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Рейсы</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalTrips}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Контрагенты</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalContractors}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Водители</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalDrivers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Транспорт</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.totalVehicles}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Последний вход
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    {userStats.lastLogin 
                      ? new Date(userStats.lastLogin).toLocaleString('ru-RU')
                      : 'Никогда'
                    }
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Всего действий
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.activityCount}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Детальная активность будет показана в основных логах</p>
              <p className="text-sm mt-2">Перейдите на вкладку "Логи активности" для просмотра</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
