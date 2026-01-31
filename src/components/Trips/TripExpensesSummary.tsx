import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, DollarSign } from 'lucide-react';
import { TripExpense, expenseTypeLabels } from '@/types/expenses';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripExpensesSummaryProps {
  tripId: string;
}

// Transform database expense to TripExpense type
const transformExpense = (dbExpense: any): TripExpense => ({
  id: dbExpense.id,
  tripId: dbExpense.trip_id,
  category: dbExpense.category,
  amount: Number(dbExpense.amount),
  description: dbExpense.description,
  date: new Date(dbExpense.date),
  createdAt: new Date(dbExpense.created_at),
  updatedAt: new Date(dbExpense.updated_at),
  createdBy: dbExpense.created_by
});

export const TripExpensesSummary: React.FC<TripExpensesSummaryProps> = ({ tripId }) => {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses((data || []).map(transformExpense));
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const expensesByType = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
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
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
            Расходы по рейсу
          </div>
          <div className="flex items-center gap-1 text-base sm:text-lg font-bold">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            {totalExpenses.toLocaleString('ru-RU')} ₽
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-4 sm:py-6 text-muted-foreground">
            <Receipt className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Расходы не добавлены</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Сводка по типам расходов */}
            <div>
              <h4 className="font-medium mb-2 sm:mb-3 text-sm">По типам расходов:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {Object.entries(expensesByType).map(([type, amount]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                    <Badge variant="outline" className="text-xs">
                      {expenseTypeLabels[type as keyof typeof expenseTypeLabels]}
                    </Badge>
                    <span className="font-medium">{amount.toLocaleString('ru-RU')} ₽</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Последние расходы */}
            <div>
              <h4 className="font-medium mb-2 sm:mb-3 text-sm">Последние расходы:</h4>
              <div className="space-y-2">
                {expenses.slice(0, 3).map((expense) => (
                  <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm p-2 border rounded gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {expenseTypeLabels[expense.category]}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {format(expense.date, 'dd.MM.yyyy', { locale: ru })}
                        </span>
                      </div>
                      {expense.description && (
                        <p className="text-muted-foreground mt-1 text-xs line-clamp-1">{expense.description}</p>
                      )}
                    </div>
                    <span className="font-medium whitespace-nowrap">{expense.amount.toLocaleString('ru-RU')} ₽</span>
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
