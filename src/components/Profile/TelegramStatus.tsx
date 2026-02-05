import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Send, Link2, Unlink, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface TelegramSubscription {
  id: string;
  telegram_chat_id: string;
  is_active: boolean;
  event_types: string[];
  created_at: string;
}

export const TelegramStatus: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);

  const { data: subscription, isLoading } = useQuery({
    queryKey: ['telegram-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('admin_telegram_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as TelegramSubscription | null;
    },
    enabled: !!user,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile-telegram', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('telegram_link_code, telegram_link_code_expires_at, telegram_notifications_enabled')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  const generateLinkCode = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      // Generate a random 6-character code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          telegram_link_code: code,
          telegram_link_code_expires_at: expiresAt,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ['profile-telegram'] });
      toast({
        title: 'Код сгенерирован',
        description: `Отправьте боту команду: /link ${code}`,
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сгенерировать код',
        variant: 'destructive',
      });
    },
  });

  const unlinkTelegram = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Delete subscription
      await supabase
        .from('admin_telegram_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Clear link code
      await supabase
        .from('profiles')
        .update({
          telegram_link_code: null,
          telegram_link_code_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-subscription'] });
      queryClient.invalidateQueries({ queryKey: ['profile-telegram'] });
      setUnlinkDialogOpen(false);
      toast({
        title: 'Telegram отвязан',
        description: 'Вы больше не будете получать уведомления в Telegram',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отвязать Telegram',
        variant: 'destructive',
      });
    },
  });

  const isLinked = !!subscription?.telegram_chat_id;
  const isCodeValid = profile?.telegram_link_code && 
    profile?.telegram_link_code_expires_at && 
    new Date(profile.telegram_link_code_expires_at) > new Date();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Telegram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[#0088cc]" />
            Telegram уведомления
          </CardTitle>
          <CardDescription>
            Получайте уведомления о новых рейсах и событиях в Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isLinked ? (
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {isLinked ? 'Подключено' : 'Не подключено'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isLinked 
                    ? `Chat ID: ${subscription.telegram_chat_id.slice(0, 4)}...`
                    : 'Telegram не привязан к аккаунту'
                  }
                </p>
              </div>
            </div>
            <Badge variant={isLinked ? 'default' : 'secondary'}>
              {isLinked ? 'Активно' : 'Отключено'}
            </Badge>
          </div>

          {/* Active link code */}
          {isCodeValid && !isLinked && (
            <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-2">
                Ваш код для привязки (действителен 10 минут):
              </p>
              <code className="text-lg font-mono font-bold text-primary">
                /link {profile.telegram_link_code}
              </code>
              <p className="text-xs text-muted-foreground mt-2">
                Отправьте эту команду боту @YourLogisticsBot
              </p>
            </div>
          )}

          {/* Event types */}
          {isLinked && subscription.event_types.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Подписка на события:</p>
              <div className="flex flex-wrap gap-1">
                {subscription.event_types.map((type) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {type === 'trip_created' && 'Новый рейс'}
                    {type === 'trip_status_changed' && 'Статус рейса'}
                    {type === 'driver_assigned' && 'Назначение водителя'}
                    {type === 'expense_added' && 'Расходы'}
                    {!['trip_created', 'trip_status_changed', 'driver_assigned', 'expense_added'].includes(type) && type}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isLinked ? (
              <Button 
                variant="outline" 
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => setUnlinkDialogOpen(true)}
              >
                <Unlink className="h-4 w-4 mr-2" />
                Отвязать Telegram
              </Button>
            ) : (
              <Button 
                className="flex-1"
                onClick={() => generateLinkCode.mutate()}
                disabled={generateLinkCode.isPending}
              >
                {generateLinkCode.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4 mr-2" />
                )}
                {isCodeValid ? 'Новый код' : 'Привязать Telegram'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отвязать Telegram?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы перестанете получать уведомления в Telegram. 
              Вы сможете привязать его снова в любое время.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlinkTelegram.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unlinkTelegram.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Отвязать
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
