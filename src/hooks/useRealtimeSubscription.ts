import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'trips' | 'contractors' | 'drivers' | 'vehicles' | 'routes' | 'cargo_types' | 'trip_expenses';

interface TableConfig {
  label: string;
  labelPlural: string;
}

const TABLE_LABELS: Record<TableName, TableConfig> = {
  trips: { label: 'Рейс', labelPlural: 'Рейсы' },
  contractors: { label: 'Контрагент', labelPlural: 'Контрагенты' },
  drivers: { label: 'Водитель', labelPlural: 'Водители' },
  vehicles: { label: 'Транспорт', labelPlural: 'Транспорт' },
  routes: { label: 'Маршрут', labelPlural: 'Маршруты' },
  cargo_types: { label: 'Тип груза', labelPlural: 'Типы грузов' },
  trip_expenses: { label: 'Расход', labelPlural: 'Расходы' },
};

interface SubscriptionOptions {
  tables: TableName[];
  onDataChange?: (table: TableName, payload: RealtimePostgresChangesPayload<any>) => void;
  showToasts?: boolean;
}

export const useRealtimeSubscription = (options: SubscriptionOptions) => {
  const { tables, onDataChange, showToasts = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const mountedRef = useRef(true);

  const getActionText = (eventType: string): string => {
    switch (eventType) {
      case 'INSERT': return 'создан(а)';
      case 'UPDATE': return 'обновлен(а)';
      case 'DELETE': return 'удален(а)';
      default: return 'изменен(а)';
    }
  };

  const handleChange = useCallback((
    table: TableName,
    payload: RealtimePostgresChangesPayload<any>
  ) => {
    if (!mountedRef.current) return;

    // Проверяем, не является ли изменение от текущего пользователя
    const record = payload.new || payload.old;
    const isOwnChange = record?.created_by === user?.id || 
                        record?.user_id === user?.id ||
                        record?.updated_by === user?.id;

    // Если изменение от текущего пользователя, не показываем уведомление
    if (isOwnChange) {
      // Но всё равно вызываем callback для обновления данных
      onDataChange?.(table, payload);
      return;
    }

    const config = TABLE_LABELS[table];
    const actionText = getActionText(payload.eventType);

    if (showToasts) {
      toast({
        title: `${config.label} ${actionText}`,
        description: `Данные в разделе "${config.labelPlural}" были изменены другим пользователем`,
        duration: 5000,
      });
    }

    onDataChange?.(table, payload);
  }, [user?.id, showToasts, toast, onDataChange]);

  useEffect(() => {
    mountedRef.current = true;

    const cleanup = () => {
      channelsRef.current.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.error('Error removing channel:', error);
        }
      });
      channelsRef.current = [];
    };

    cleanup();

    tables.forEach(table => {
      const channelName = `realtime-${table}-${Date.now()}-${Math.random()}`;
      
      try {
        const channel = supabase
          .channel(channelName)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: table
          }, (payload) => {
            console.log(`Realtime change on ${table}:`, payload);
            handleChange(table, payload);
          })
          .subscribe((status) => {
            console.log(`Realtime subscription to ${table}:`, status);
          });

        channelsRef.current.push(channel);
      } catch (error) {
        console.error(`Error creating channel for ${table}:`, error);
      }
    });

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [tables.join(','), handleChange]);

  return {
    isSubscribed: channelsRef.current.length > 0
  };
};
