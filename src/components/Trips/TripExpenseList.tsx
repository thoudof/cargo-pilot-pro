import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Receipt } from 'lucide-react';
import { TripExpense, expenseTypeLabels } from '@/types/expenses';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripExpenseListProps {
  expenses: TripExpense[];
  onEdit: (expense: TripExpense) => void;
  onDelete: (expense: TripExpense) => void;
}

export const TripExpenseList: React.FC<TripExpenseListProps> = ({
  expenses,
  onEdit,
  onDelete
}) => {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground">
        <Receipt className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
        <p className="text-sm">Расходы по рейсу не добавлены</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div 
          key={expense.id} 
          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg border bg-muted/30 gap-2"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px] sm:text-xs">
                {expenseTypeLabels[expense.category]}
              </Badge>
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {format(expense.date, 'dd.MM.yyyy', { locale: ru })}
              </span>
            </div>
            {expense.description && (
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{expense.description}</p>
            )}
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
            <span className="font-semibold text-sm sm:text-base">
              {expense.amount.toLocaleString('ru-RU')} ₽
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                onClick={() => onEdit(expense)}
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => onDelete(expense)}
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};