
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface ConnectionStatusProps {
  quality: 'fast' | 'slow' | 'very_slow';
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  quality,
  loading,
  error,
  onRetry
}) => {
  if (!error && quality === 'fast') return null;

  const getIcon = () => {
    if (error) return <WifiOff className="h-4 w-4" />;
    if (quality === 'very_slow') return <AlertTriangle className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (error) return 'Ошибка соединения. Проверьте подключение к интернету.';
    if (quality === 'very_slow') return 'Медленное соединение. Данные загружаются дольше обычного.';
    if (quality === 'slow') return 'Соединение работает медленно. Оптимизируем загрузку данных.';
    return '';
  };

  const getVariant = () => {
    if (error) return 'destructive' as const;
    return 'default' as const;
  };

  return (
    <Alert variant={getVariant()} className="mb-4">
      {getIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span>{getMessage()}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={loading}
          className="ml-2"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Повторить
        </Button>
      </AlertDescription>
    </Alert>
  );
};
