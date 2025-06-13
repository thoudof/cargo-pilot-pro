
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Receipt, TrendingDown, DollarSign, Calculator } from 'lucide-react';
import { expenseTypeLabels } from '@/types/expenses';

interface ExpenseStatsProps {
  stats: {
    totalExpenses: number;
    completedTripsExpenses: number;
    expensesByType: Record<string, number>;
    profit: number;
    profitMargin: number;
    averageExpensePerTrip: number;
    totalCargoValue: number;
  };
  formatCurrency: (value: number) => string;
}

export const ExpenseStats: React.FC<ExpenseStatsProps> = ({ stats, formatCurrency }) => {
  const maxExpenseType = Object.entries(stats.expensesByType).reduce(
    (max, [type, amount]) => amount > max.amount ? { type, amount } : max,
    { type: '', amount: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              Завершенные: {formatCurrency(stats.completedTripsExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Прибыль</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.profit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Маржа: {stats.profitMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средние расходы</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.averageExpensePerTrip)}
            </div>
            <p className="text-xs text-muted-foreground">На рейс</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доля расходов</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCargoValue > 0 
                ? ((stats.totalExpenses / stats.totalCargoValue) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">От выручки</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Расходы по типам
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(stats.expensesByType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, amount]) => {
                const percentage = stats.totalExpenses > 0 
                  ? (amount / stats.totalExpenses) * 100 
                  : 0;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {expenseTypeLabels[type] || type}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            
            {Object.keys(stats.expensesByType).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Данных о расходах пока нет</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
