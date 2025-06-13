
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { DialogTrigger } from '@/components/ui/dialog';
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
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Расходы по рейсу
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">
              Итого: {totalExpenses.toLocaleString('ru-RU')} ₽
            </span>
          </div>
          <DialogTrigger asChild>
            <Button size="sm" onClick={onAddExpense}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить расход
            </Button>
          </DialogTrigger>
        </div>
      </div>
    </CardHeader>
  );
};
