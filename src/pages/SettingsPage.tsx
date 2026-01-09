
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabaseService } from '@/services/supabaseService';
import { activityLogger } from '@/services/activityLogger';
import { useToast } from '@/hooks/use-toast';
import { User, Bell, Shield, Database, Download, Trash2, Key, Smartphone, Settings } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/Settings/ChangePasswordDialog';
import { TwoFactorSetupDialog } from '@/components/Settings/TwoFactorSetupDialog';
import { ThemeToggle } from '@/components/Theme/ThemeToggle';
import { useTheme } from '@/components/Theme/ThemeProvider';
import { PageHeader } from '@/components/Layout/PageHeader';

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

  const SettingsSection: React.FC<{ 
    icon: React.ReactNode; 
    title: string; 
    children: React.ReactNode 
  }> = ({ icon, title, children }) => (
    <div className="card-elevated">
      <div className="p-4 sm:p-6 border-b border-border">
        <h2 className="flex items-center gap-2 font-semibold">
          {icon}
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Настройки" 
        description="Управление профилем и настройками приложения"
      />

      {/* Профиль пользователя */}
      <SettingsSection icon={<User className="h-5 w-5 text-primary" />} title="Профиль">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-muted h-10"
            />
            <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm">Полное имя</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Введите полное имя"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">Логин</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Введите логин"
                className="h-10"
              />
            </div>
          </div>

          <Button onClick={handleProfileUpdate} disabled={loading} className="w-full sm:w-auto">
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </SettingsSection>

      {/* Настройки уведомлений */}
      <SettingsSection icon={<Bell className="h-5 w-5 text-primary" />} title="Уведомления">
        {Object.entries(notifications).map(([key, value], index) => (
          <div key={key}>
            {index > 0 && <Separator className="my-4" />}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{getNotificationLabel(key as keyof NotificationSettings)}</p>
                <p className="text-xs text-muted-foreground">
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
          </div>
        ))}
      </SettingsSection>

      {/* Настройки приложения */}
      <SettingsSection icon={<Settings className="h-5 w-5 text-primary" />} title="Приложение">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Тема оформления</p>
            <p className="text-xs text-muted-foreground">Выберите тему интерфейса</p>
          </div>
          <ThemeToggle />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Автосинхронизация</p>
            <p className="text-xs text-muted-foreground">Автоматически синхронизировать данные</p>
          </div>
          <Switch
            checked={appSettings.autoSync}
            onCheckedChange={(value) => handleAppSettingUpdate('autoSync', value)}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Компактный вид</p>
            <p className="text-xs text-muted-foreground">Отображать информацию компактно</p>
          </div>
          <Switch
            checked={appSettings.compactView}
            onCheckedChange={(value) => handleAppSettingUpdate('compactView', value)}
          />
        </div>
      </SettingsSection>

      {/* Безопасность */}
      <SettingsSection icon={<Shield className="h-5 w-5 text-primary" />} title="Безопасность">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            onClick={() => setChangePasswordOpen(true)}
          >
            <Key className="h-4 w-4" />
            Изменить пароль
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-11"
            onClick={() => setTwoFactorOpen(true)}
          >
            <Smartphone className="h-4 w-4" />
            Двухфакторная аутентификация
          </Button>
        </div>
      </SettingsSection>

      {/* Данные */}
      <SettingsSection icon={<Database className="h-5 w-5 text-primary" />} title="Данные">
        <Button
          variant="outline"
          onClick={handleExportData}
          className="w-full justify-start gap-2 h-11"
        >
          <Download className="h-4 w-4" />
          Экспортировать мои данные
        </Button>

        <Separator />

        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <h4 className="font-medium text-destructive mb-2">Опасная зона</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Удаление аккаунта приведет к безвозвратной потере всех данных.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAccount}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Удалить аккаунт
          </Button>
        </div>
      </SettingsSection>

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
