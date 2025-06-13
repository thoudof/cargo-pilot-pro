
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <div className="text-center py-8 text-muted-foreground">
        <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Расходы по рейсу не добавлены</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Тип</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Дата</TableHead>
            <TableHead>Описание</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                <Badge variant="outline">
                  {expenseTypeLabels[expense.expenseType]}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                {expense.amount.toLocaleString('ru-RU')} ₽
              </TableCell>
              <TableCell>
                {format(expense.expenseDate, 'dd.MM.yyyy', { locale: ru })}
              </TableCell>
              <TableCell>
                {expense.description || '-'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(expense)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(expense)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
