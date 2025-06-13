
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Weight, Receipt } from 'lucide-react';

interface FinancialMetricsProps {
  stats: {
    totalCargoValue: number;
    completedCargoValue: number;
    averageCargoValue: number;
    completionRate: number;
    totalWeight: number;
    totalVolume: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
  };
  formatCurrency: (value: number) => string;
  formatWeight: (value: number) => string;
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ 
  stats, 
  formatCurrency, 
  formatWeight 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Общая стоимость грузов</CardTitle>
          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{formatCurrency(stats.totalCargoValue)}</div>
          <p className="text-xs text-muted-foreground">
            Завершено: {formatCurrency(stats.completedCargoValue)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Расходы</CardTitle>
          <Receipt className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-lg sm:text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            Успешность: {stats.completionRate.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Прибыль</CardTitle>
          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className={`text-lg sm:text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.profit)}
          </div>
          <p className="text-xs text-muted-foreground">
            Маржа: {stats.profitMargin.toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
          <CardTitle className="text-xs sm:text-sm font-medium">Общий вес грузов</CardTitle>
          <Weight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="text-lg sm:text-2xl font-bold">{formatWeight(stats.totalWeight)}</div>
          <p className="text-xs text-muted-foreground">
            Объем: {stats.totalVolume.toLocaleString('ru-RU')} м³
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
