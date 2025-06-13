
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { ExpenseType, expenseTypeLabels } from '@/types/expenses';

interface ExpenseFormData {
  expenseType: ExpenseType;
  amount: string;
  description: string;
  expenseDate: string;
}

interface TripFormExpensesProps {
  expenses: ExpenseFormData[];
  onExpensesChange: (expenses: ExpenseFormData[]) => void;
}

export const TripFormExpenses: React.FC<TripFormExpensesProps> = ({
  expenses,
  onExpensesChange
}) => {
  const addExpense = () => {
    const newExpenses = [...expenses, {
      expenseType: ExpenseType.FUEL,
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0]
    }];
    onExpensesChange(newExpenses);
  };

  const removeExpense = (index: number) => {
    const newExpenses = expenses.filter((_, i) => i !== index);
    onExpensesChange(newExpenses);
  };

  const updateExpense = (index: number, field: keyof ExpenseFormData, value: string) => {
    const newExpenses = [...expenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    onExpensesChange(newExpenses);
  };

  const totalExpenses = expenses.reduce((sum, expense) => {
    const amount = parseFloat(expense.amount) || 0;
    return sum + amount;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Расходы по рейсу
          </CardTitle>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              Итого: {totalExpenses.toLocaleString('ru-RU')} ₽
            </span>
            <Button type="button" onClick={addExpense} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Добавить расход
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Расходы не добавлены</p>
            <Button type="button" onClick={addExpense} variant="outline" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Добавить первый расход
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((expense, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Тип расхода</label>
                    <Select
                      value={expense.expenseType}
                      onValueChange={(value) => updateExpense(index, 'expenseType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(expenseTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Сумма (₽)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={expense.amount}
                      onChange={(e) => updateExpense(index, 'amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Дата</label>
                    <Input
                      type="date"
                      value={expense.expenseDate}
                      onChange={(e) => updateExpense(index, 'expenseDate', e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeExpense(index)}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-sm font-medium">Описание</label>
                  <Textarea
                    placeholder="Дополнительное описание расхода..."
                    value={expense.description}
                    onChange={(e) => updateExpense(index, 'description', e.target.value)}
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
