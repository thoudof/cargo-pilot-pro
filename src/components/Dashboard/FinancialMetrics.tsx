
import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Weight, Receipt } from 'lucide-react';

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Стоимость грузов */}
      <div className="card-elevated p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Стоимость грузов</p>
            <p className="text-xl sm:text-2xl font-bold">{formatCurrency(stats.totalCargoValue)}</p>
            <p className="text-xs text-muted-foreground">
              Завершено: {formatCurrency(stats.completedCargoValue)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-600">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Расходы */}
      <div className="card-elevated p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Расходы</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">
                Успешность: {stats.completionRate.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-500/10 text-red-600">
            <Receipt className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Прибыль */}
      <div className="card-elevated p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Прибыль</p>
            <p className={`text-xl sm:text-2xl font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {formatCurrency(stats.profit)}
            </p>
            <div className={`flex items-center gap-1 text-xs font-medium ${
              stats.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {stats.profitMargin >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>Маржа: {stats.profitMargin.toFixed(1)}%</span>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            stats.profit >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'
          }`}>
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Вес грузов */}
      <div className="card-elevated p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Общий вес</p>
            <p className="text-xl sm:text-2xl font-bold">{formatWeight(stats.totalWeight)}</p>
            <p className="text-xs text-muted-foreground">
              Объем: {stats.totalVolume.toLocaleString('ru-RU')} м³
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-600">
            <Weight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
