
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
import { User, Bell, Shield, Database, Download, Trash2, Key, Smartphone, Settings, Palette } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/Settings/ChangePasswordDialog';
import { TwoFactorSetupDialog } from '@/components/Settings/TwoFactorSetupDialog';
import { ThemeToggle } from '@/components/Theme/ThemeToggle';
import { useTheme } from '@/components/Theme/ThemeProvider';

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

interface AppSettings {
  language: 'ru' | 'en';
  autoSync: boolean;
  compactView: boolean;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
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
  const [appSettings, setAppSettings] = useState<AppSettings>({
    language: 'ru',
    autoSync: true,
    compactView: false
  });

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || '',
        username: user.user_metadata?.username || '',
        role: user.user_metadata?.role || 'dispatcher'
      });
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      // Загружаем настройки из localStorage или Supabase
      const savedNotifications = localStorage.getItem('notification_settings');
      const savedAppSettings = localStorage.getItem('app_settings');
      
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications));
      }
      
      if (savedAppSettings) {
        setAppSettings(JSON.parse(savedAppSettings));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

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
    const updatedNotifications = { ...notifications, [key]: value };
    setNotifications(updatedNotifications);
    localStorage.setItem('notification_settings', JSON.stringify(updatedNotifications));
    
    await activityLogger.log({
      action: 'update_notification_settings',
      entityType: 'user_settings',
      details: { setting: key, value }
    });

    toast({
      title: 'Настройки обновлены',
      description: `Настройка "${getNotificationLabel(key)}" ${value ? 'включена' : 'отключена'}`
    });
  };

  const handleAppSettingUpdate = async (key: keyof AppSettings, value: any) => {
    const updatedSettings = { ...appSettings, [key]: value };
    setAppSettings(updatedSettings);
    localStorage.setItem('app_settings', JSON.stringify(updatedSettings));

    toast({
      title: 'Настройки приложения обновлены',
      description: `${getAppSettingLabel(key)} изменена`
    });
  };


  const getNotificationLabel = (key: keyof NotificationSettings): string => {
    const labels = {
      emailNotifications: 'Email уведомления',
      pushNotifications: 'Push уведомления',
      tripUpdates: 'Уведомления о рейсах',
      systemAlerts: 'Системные уведомления'
    };
    return labels[key];
  };

  const getAppSettingLabel = (key: keyof AppSettings): string => {
    const labels = {
      language: 'Язык',
      autoSync: 'Автосинхронизация',
      compactView: 'Компактный вид'
    };
    return labels[key];
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        profile,
        notifications,
        appSettings,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transport-app-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await activityLogger.log({
        action: 'export_data',
        entityType: 'user_data'
      });

      toast({
        title: 'Данные экспортированы',
        description: 'Файл с данными загружен на ваше устройство'
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось экспортировать данные',
        variant: 'destructive'
      });
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
          {Object.entries(notifications).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{getNotificationLabel(key as keyof NotificationSettings)}</Label>
                  <p className="text-sm text-gray-500">
                    {key === 'emailNotifications' && 'Получать уведомления на email'}
                    {key === 'pushNotifications' && 'Получать push-уведомления в браузере'}
                    {key === 'tripUpdates' && 'Уведомления об изменениях в рейсах'}
                    {key === 'systemAlerts' && 'Важные системные сообщения'}
                  </p>
                </div>
                <Switch
                  checked={value}
                  onCheckedChange={(checked) => handleNotificationUpdate(key as keyof NotificationSettings, checked)}
                />
              </div>
              <Separator className="mt-4" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Настройки приложения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки приложения
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Тема оформления</Label>
              <p className="text-sm text-muted-foreground">Выберите тему оформления приложения</p>
            </div>
            <ThemeToggle />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Автосинхронизация</Label>
              <p className="text-sm text-gray-500">Автоматически синхронизировать данные</p>
            </div>
            <Switch
              checked={appSettings.autoSync}
              onCheckedChange={(value) => handleAppSettingUpdate('autoSync', value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Компактный вид</Label>
              <p className="text-sm text-gray-500">Отображать информацию в компактном виде</p>
            </div>
            <Switch
              checked={appSettings.compactView}
              onCheckedChange={(value) => handleAppSettingUpdate('compactView', value)}
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
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => setChangePasswordOpen(true)}
          >
            <Key className="h-4 w-4" />
            Изменить пароль
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={() => setTwoFactorOpen(true)}
          >
            <Smartphone className="h-4 w-4" />
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

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />

      <TwoFactorSetupDialog
        open={twoFactorOpen}
        onOpenChange={setTwoFactorOpen}
      />
    </div>
  );
};
