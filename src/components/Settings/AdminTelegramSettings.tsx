import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle, Check, Copy, RefreshCw, Unlink, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'trip_created', label: 'Новый рейс создан' },
  { value: 'trip_updated', label: 'Рейс изменён' },
  { value: 'trip_status_changed', label: 'Статус рейса изменён' },
  { value: 'trip_deleted', label: 'Рейс удалён' },
  { value: 'driver_created', label: 'Новый водитель добавлен' },
  { value: 'driver_updated', label: 'Водитель изменён' },
  { value: 'driver_deleted', label: 'Водитель удалён' },
  { value: 'vehicle_created', label: 'Новое ТС добавлено' },
  { value: 'vehicle_updated', label: 'ТС изменено' },
  { value: 'vehicle_deleted', label: 'ТС удалено' },
  { value: 'expense_created', label: 'Новый расход добавлен' },
  { value: 'document_uploaded', label: 'Документ загружен' },
] as const;

type EventType = typeof EVENT_TYPES[number]['value'];

interface Subscription {
  id: string;
  telegram_chat_id: string;
  event_types: EventType[];
  is_active: boolean;
}

const BOT_USERNAME = 'fix_notif_bot';

export const AdminTelegramSettings: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeExpires, setLinkCodeExpires] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<EventType[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [user, isAdmin]);

  const loadSubscription = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_telegram_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSubscription({
          id: data.id,
          telegram_chat_id: data.telegram_chat_id,
          event_types: data.event_types as EventType[],
          is_active: data.is_active,
        });
        setSelectedEvents(data.event_types as EventType[]);
      }

      // Load link code from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('telegram_link_code, telegram_link_code_expires_at')
        .eq('id', user.id)
        .single();

      if (profile?.telegram_link_code) {
        setLinkCode(profile.telegram_link_code);
        setLinkCodeExpires(profile.telegram_link_code_expires_at ? new Date(profile.telegram_link_code_expires_at) : null);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLinkCode = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('profiles')
        .update({
          telegram_link_code: `ADMIN_${code}`,
          telegram_link_code_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setLinkCode(`ADMIN_${code}`);
      setLinkCodeExpires(expiresAt);
      toast.success('Код сгенерирован');
    } catch (error) {
      toast.error('Не удалось сгенерировать код');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!user || !subscription) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_telegram_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setSubscription(null);
      setSelectedEvents([]);
      toast.success('Telegram отвязан');
    } catch (error) {
      toast.error('Не удалось отвязать Telegram');
    } finally {
      setSaving(false);
    }
  };

  const toggleEvent = (event: EventType) => {
    setSelectedEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  const selectAll = () => {
    setSelectedEvents(EVENT_TYPES.map(e => e.value));
  };

  const deselectAll = () => {
    setSelectedEvents([]);
  };

  const saveSubscription = async () => {
    if (!user || !subscription) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_telegram_subscriptions')
        .update({
          event_types: selectedEvents,
          is_active: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSubscription(prev => prev ? { ...prev, event_types: selectedEvents } : null);
      toast.success('Настройки сохранены');
    } catch (error) {
      toast.error('Не удалось сохранить настройки');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Скопировано');
  };

  const isCodeExpired = linkCodeExpires && new Date() > linkCodeExpires;
  const botLink = linkCode ? `https://t.me/${BOT_USERNAME}?start=${linkCode}` : null;

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          Уведомления в Telegram
        </CardTitle>
        <CardDescription>
          Получайте уведомления о событиях системы в Telegram
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {subscription ? (
          <>
            <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-green-700 dark:text-green-400 font-medium">
                Telegram подключён
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Подписка на события</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Выбрать все
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Снять все
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {EVENT_TYPES.map(event => (
                  <div key={event.value} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Switch
                      id={event.value}
                      checked={selectedEvents.includes(event.value)}
                      onCheckedChange={() => toggleEvent(event.value)}
                    />
                    <Label htmlFor={event.value} className="text-sm cursor-pointer">
                      {event.label}
                    </Label>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveSubscription} 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Сохранить настройки
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={handleUnlink}
                  disabled={saving}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Отвязать
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {linkCode && !isCodeExpired ? (
              <>
                <div className="space-y-2">
                  <Label>Код подключения</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded-lg text-center text-xl font-mono tracking-wider">
                      {linkCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(linkCode)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  {linkCodeExpires && (
                    <p className="text-xs text-muted-foreground">
                      Действителен до: {linkCodeExpires.toLocaleString('ru-RU')}
                    </p>
                  )}
                </div>

                {botLink && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(botLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть в Telegram
                  </Button>
                )}

                <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                  <p className="font-medium">Инструкция:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>Откройте бота @{BOT_USERNAME} в Telegram</li>
                    <li>Отправьте команду: <code>/link {linkCode}</code></li>
                    <li>Или нажмите кнопку выше</li>
                  </ol>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={generateLinkCode}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сгенерировать новый код
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4 py-4">
                {isCodeExpired && (
                  <Badge variant="secondary">Код истёк</Badge>
                )}
                <p className="text-muted-foreground">
                  Подключите Telegram для получения уведомлений о событиях системы
                </p>
                <Button onClick={generateLinkCode}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Сгенерировать код
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
