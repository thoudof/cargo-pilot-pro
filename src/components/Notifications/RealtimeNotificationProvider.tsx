import React, { createContext, useContext, useCallback, useState } from 'react';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useQueryClient } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type TableName = 'trips' | 'contractors' | 'drivers' | 'vehicles' | 'routes' | 'cargo_types' | 'trip_expenses';

interface RealtimeNotificationContextType {
  lastChange: { table: TableName; eventType: string; timestamp: number } | null;
  refreshTable: (table: TableName) => void;
}

const RealtimeNotificationContext = createContext<RealtimeNotificationContextType>({
  lastChange: null,
  refreshTable: () => {},
});

export const useRealtimeNotifications = () => {
  return useContext(RealtimeNotificationContext);
};

interface RealtimeNotificationProviderProps {
  children: React.ReactNode;
}

export const RealtimeNotificationProvider: React.FC<RealtimeNotificationProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const [lastChange, setLastChange] = useState<{ table: TableName; eventType: string; timestamp: number } | null>(null);

  const refreshTable = useCallback((table: TableName) => {
    // Инвалидируем кеш для соответствующей таблицы
    queryClient.invalidateQueries({ queryKey: [table] });
  }, [queryClient]);

  const handleDataChange = useCallback((
    table: TableName,
    payload: RealtimePostgresChangesPayload<any>
  ) => {
    console.log(`Data changed in ${table}:`, payload.eventType);
    
    setLastChange({
      table,
      eventType: payload.eventType,
      timestamp: Date.now(),
    });

    // Инвалидируем кеш React Query для автоматического обновления данных
    switch (table) {
      case 'trips':
        queryClient.invalidateQueries({ queryKey: ['trips'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        break;
      case 'contractors':
        queryClient.invalidateQueries({ queryKey: ['contractors'] });
        break;
      case 'drivers':
        queryClient.invalidateQueries({ queryKey: ['drivers'] });
        break;
      case 'vehicles':
        queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        break;
      case 'routes':
        queryClient.invalidateQueries({ queryKey: ['routes'] });
        break;
      case 'cargo_types':
        queryClient.invalidateQueries({ queryKey: ['cargo-types'] });
        break;
      case 'trip_expenses':
        queryClient.invalidateQueries({ queryKey: ['trip-expenses'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        break;
    }
  }, [queryClient]);

  useRealtimeSubscription({
    tables: ['trips', 'contractors', 'drivers', 'vehicles', 'routes', 'cargo_types', 'trip_expenses'],
    onDataChange: handleDataChange,
    showToasts: true,
  });

  return (
    <RealtimeNotificationContext.Provider value={{ lastChange, refreshTable }}>
      {children}
    </RealtimeNotificationContext.Provider>
  );
};
