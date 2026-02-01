import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { FileSpreadsheet, FileText, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportReport, ExportFormat } from '@/utils/exportUtils';
import { TripWithExpenses } from '@/types/reports';

interface ExportDropdownProps {
  trips: TripWithExpenses[];
  contractors: Record<string, string>;
  summaryStats?: {
    totalTrips: number;
    completedTrips: number;
    activeTrips: number;
    cancelledTrips: number;
    actualRevenue: number;
    actualExpenses: number;
    actualProfit: number;
    potentialRevenue: number;
    potentialProfit: number;
  };
  disabled?: boolean;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  trips,
  contractors,
  summaryStats,
  disabled = false,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    if (trips.length === 0) {
      toast({
        title: 'Нет данных для экспорта',
        description: 'Измените фильтры или дождитесь загрузки данных.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const fileName = exportReport({
        trips,
        contractors,
        format,
        summaryStats,
      });

      const formatLabels: Record<ExportFormat, string> = {
        excel: 'Excel',
        pdf: 'PDF',
        csv: 'CSV',
      };

      toast({
        title: 'Экспорт завершён',
        description: `Файл ${fileName} успешно сохранён в формате ${formatLabels[format]}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Ошибка экспорта',
        description: 'Не удалось сформировать файл. Попробуйте ещё раз.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Формат файла</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-primary" />
          <span>Excel (.xlsx)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-destructive" />
          <span>PDF (.pdf)</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
          <FileDown className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>CSV (.csv)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
