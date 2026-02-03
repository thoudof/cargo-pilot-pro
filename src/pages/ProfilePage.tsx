import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { activityLogger } from '@/services/activityLogger';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Camera, Mail, Phone, Calendar, Shield, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Profile {
  full_name: string;
  phone: string;
  avatar_url: string;
}

export const ProfilePage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    phone: '',
    avatar_url: ''
  });

  const userInitial = profile.full_name?.charAt(0) || user?.email?.charAt(0) || 'U';
  const isAdmin = hasRole('admin');
  const isDispatcher = hasRole('dispatcher');
  const isDriver = hasRole('driver');

  const getRoleLabel = () => {
    if (isAdmin) return 'Администратор';
    if (isDispatcher) return 'Диспетчер';
    if (isDriver) return 'Водитель';
    return 'Пользователь';
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, avatar_url')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          full_name: data.full_name || user?.user_metadata?.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || ''
        });
      } else {
        setProfile({
          full_name: user?.user_metadata?.full_name || '',
          phone: '',
          avatar_url: ''
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name
        }
      });

      if (authError) throw authError;

      // Update or insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      await activityLogger.log({
        action: 'update_profile',
        entityType: 'user_profile',
        details: { updated_fields: ['full_name', 'phone'] }
      });

      toast({
        title: 'Профиль обновлен',
        description: 'Ваши данные успешно сохранены'
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Неизвестно';
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru });
    } catch {
      return 'Неизвестно';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Мой профиль" 
        description="Управление личными данными и настройками аккаунта"
      />

      {/* Avatar and basic info */}
      <div className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {userInitial}
              </AvatarFallback>
            </Avatar>
            <button 
              className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors"
              onClick={() => toast({ title: 'Скоро', description: 'Загрузка аватара будет доступна в ближайшее время' })}
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold">{profile.full_name || 'Пользователь'}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Shield className="h-3.5 w-3.5" />
              {getRoleLabel()}
            </div>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Информация об аккаунте
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Дата регистрации</p>
              <p className="font-medium">{formatDate(user?.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit profile form */}
      <div className="card-elevated p-6 space-y-4">
        <h3 className="font-semibold">Редактировать профиль</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              value={profile.full_name}
              onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Введите ваше имя"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Телефон</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (999) 123-45-67"
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
        </div>

        <Button 
          onClick={handleProfileUpdate} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
