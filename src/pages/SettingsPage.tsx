import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { activityLogger } from '@/services/activityLogger';
import { useToast } from '@/hooks/use-toast';
import { User, Bell, Shield, Database, Download, Trash2 } from 'lucide-react';

interface UserProfile {
  full_name: string;
  username: string;
  role: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  tripUpdates: boolean;
  systemAlerts: boolean;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    username: '',
    role: 'dispatcher'
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    tripUpdates: true,
    systemAlerts: true
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        username: user.user_metadata?.username || '',
        role: user.user_metadata?.role || 'dispatcher'
      });
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabaseService.supabase.auth.updateUser({
        data: {
          full_name: profile.full_name,
          username: profile.username,
          role: profile.role
        }
      });

      if (error) throw error;

      await activityLogger.log({
        action: 'update_profile',
        entityType: 'user_profile',
        details: { updated_fields: ['full_name', 'username', 'role'] }
      });

      toast({
        title: 'Профиль обновлен',
        description: 'Данные профиля успешно сохранены'
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить профиль',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (key: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    
    await activityLogger.log({
      action: 'update_notification_settings',
      entityType: 'user_settings',
      details: { setting: key, value }
    });

    toast({
      title: 'Настройки обновлены',
      description: `Настройка "${key}" ${value ? 'включена' : 'отключена'}`
    });
  };

  const handleExportData = async () => {
    try {
      await activityLogger.log({
        action: 'export_data',
        entityType: 'user_data'
      });

      toast({
        title: 'Экспорт данных',
        description: 'Функция экспорта будет реализована в следующих версиях'
      });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      try {
        await activityLogger.log({
          action: 'delete_account_request',
          entityType: 'user_account'
        });

        toast({
          title: 'Запрос на удаление',
          description: 'Обратитесь к администратору для удаления аккаунта',
          variant: 'destructive'
        });
      } catch (error) {
        console.error('Delete account error:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Профиль пользователя */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Профиль пользователя
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email нельзя изменить</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Введите полное имя"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Введите имя пользователя"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Input
              id="role"
              value={profile.role}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Роль назначается администратором</p>
          </div>

          <Button onClick={handleProfileUpdate} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </CardContent>
      </Card>

      {/* Настройки уведомлений */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Уведомления
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email уведомления</Label>
              <p className="text-sm text-gray-500">Получать уведомления на email</p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(value) => handleNotificationUpdate('emailNotifications', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Push уведомления</Label>
              <p className="text-sm text-gray-500">Получать push-уведомления в браузере</p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(value) => handleNotificationUpdate('pushNotifications', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Уведомления о рейсах</Label>
              <p className="text-sm text-gray-500">Уведомления об изменениях в рейсах</p>
            </div>
            <Switch
              checked={notifications.tripUpdates}
              onCheckedChange={(value) => handleNotificationUpdate('tripUpdates', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Системные уведомления</Label>
              <p className="text-sm text-gray-500">Важные системные сообщения</p>
            </div>
            <Switch
              checked={notifications.systemAlerts}
              onCheckedChange={(value) => handleNotificationUpdate('systemAlerts', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Безопасность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full">
            Изменить пароль
          </Button>
          <Button variant="outline" className="w-full">
            Настроить двухфакторную аутентификацию
          </Button>
        </CardContent>
      </Card>

      {/* Данные и конфиденциальность */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Данные и конфиденциальность
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={handleExportData}
            className="w-full flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Экспортировать мои данные
          </Button>

          <Separator />

          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Опасная зона</h4>
            <p className="text-sm text-red-600 mb-4">
              Удаление аккаунта приведет к безвозвратной потере всех данных.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Удалить аккаунт
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
