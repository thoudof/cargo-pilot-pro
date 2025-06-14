import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, DollarSign } from 'lucide-react';
import { TripExpense, expenseTypeLabels } from '@/types/expenses';
import { appDbService } from '@/services/database/AppDatabaseService';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripExpensesSummaryProps {
  tripId: string;
}

export const TripExpensesSummary: React.FC<TripExpensesSummaryProps> = ({ tripId }) => {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, [tripId]);

  const loadExpenses = async () => {
    try {
      const data = await appDbService.getTripExpenses(tripId);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.expenseType] = (acc[expense.expenseType] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Расходы по рейсу
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Расходы по рейсу
          </div>
          <div className="flex items-center gap-1 text-lg font-bold">
            <DollarSign className="h-5 w-5" />
            {totalExpenses.toLocaleString('ru-RU')} ₽
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Расходы не добавлены</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Сводка по типам расходов */}
            <div>
              <h4 className="font-medium mb-3">По типам расходов:</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(expensesByType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                    <Badge variant="outline">
                      {expenseTypeLabels[type as keyof typeof expenseTypeLabels]}
                    </Badge>
                    <span className="font-medium">{amount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Последние расходы */}
            <div>
              <h4 className="font-medium mb-3">Последние расходы:</h4>
              <div className="space-y-2">
                {expenses.slice(-3).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between text-sm p-2 border rounded">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {expenseTypeLabels[expense.expenseType]}
                        </Badge>
                        <span className="text-muted-foreground">
                          {format(expense.expenseDate, 'dd.MM.yyyy', { locale: ru })}
                        </span>
                      </div>
                      {expense.description && (
                        <p className="text-muted-foreground mt-1">{expense.description}</p>
                      )}
                    </div>
                    <span className="font-medium">{expense.amount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
