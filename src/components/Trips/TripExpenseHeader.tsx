import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Receipt, DollarSign } from 'lucide-react';

interface TripExpenseHeaderProps {
  totalExpenses: number;
  onAddExpense: () => void;
}

export const TripExpenseHeader: React.FC<TripExpenseHeaderProps> = ({
  totalExpenses,
  onAddExpense
}) => {
  return (
    <CardHeader className="pb-2 sm:pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
          <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
          Управление расходами
        </CardTitle>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="font-medium">
              {totalExpenses.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <Button size="sm" onClick={onAddExpense} className="text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Добавить расход</span>
            <span className="sm:hidden">Добавить</span>
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};