import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, X, CheckSquare, Download } from 'lucide-react';
import { Trip } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface TripBulkActionsProps {
  selectedTrips: Trip[];
  onEdit: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalTrips: number;
  allSelected: boolean;
}

export const TripBulkActions: React.FC<TripBulkActionsProps> = ({
  selectedTrips,
  onEdit,
  onDelete,
  onClearSelection,
  onSelectAll,
  totalTrips,
  allSelected
}) => {
  const { toast } = useToast();

  const handleExport = () => {
    try {
      const headers = [
        'ID',
        'Откуда',
        'Куда',
        'Статус',
        'Дата отправления',
        'Водитель',
        'Транспорт',
        'Стоимость груза',
        'Вес (кг)',
        'Объём (м³)'
      ];

      const rows = selectedTrips.map(trip => [
        trip.id,
        trip.pointA,
        trip.pointB,
        trip.status,
        new Date(trip.departureDate).toLocaleDateString('ru-RU'),
        trip.driver?.name || '',
        trip.vehicle?.licensePlate || '',
        trip.cargo?.value || '',
        trip.cargo?.weight || '',
        trip.cargo?.volume || ''
      ]);

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `trips_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Экспорт завершён',
        description: `Экспортировано ${selectedTrips.length} рейс(ов)`
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

  if (selectedTrips.length === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20 animate-in slide-in-from-top-2">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1">
          <CheckSquare className="h-3 w-3" />
          Выбрано: {selectedTrips.length} из {totalTrips}
        </Badge>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={allSelected ? onClearSelection : onSelectAll}
        >
          {allSelected ? 'Снять выделение' : 'Выбрать все'}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Экспорт</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="gap-2"
        >
          <Edit2 className="h-4 w-4" />
          <span className="hidden sm:inline">Редактировать</span>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Удалить</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить выбранные рейсы?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь удалить {selectedTrips.length} рейс(ов). Это действие нельзя отменить.
                Все связанные данные (расходы, документы) также будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                onClick={onDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Удалить {selectedTrips.length} рейс(ов)
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
