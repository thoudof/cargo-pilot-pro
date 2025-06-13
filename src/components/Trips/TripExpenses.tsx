
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Receipt, Ruble } from 'lucide-react';
import { TripExpense, ExpenseType, expenseTypeLabels } from '@/types/expenses';
import { supabaseService } from '@/services/supabaseService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TripExpensesProps {
  tripId: string;
}

export const TripExpenses: React.FC<TripExpensesProps> = ({ tripId }) => {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | undefined>();
  const [formData, setFormData] = useState({
    expenseType: ExpenseType.FUEL,
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  useEffect(() => {
    loadExpenses();
  }, [tripId]);

  const loadExpenses = async () => {
    try {
      const data = await supabaseService.getTripExpenses(tripId);
      setExpenses(data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить расходы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      expenseType: ExpenseType.FUEL,
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        tripId,
        expenseType: formData.expenseType,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        expenseDate: new Date(formData.expenseDate)
      };

      if (editingExpense) {
        await supabaseService.updateTripExpense(editingExpense.id, expenseData);
        toast({
          title: 'Расход обновлен',
          description: 'Расход успешно обновлен'
        });
      } else {
        await supabaseService.createTripExpense(expenseData);
        toast({
          title: 'Расход добавлен',
          description: 'Расход успешно добавлен'
        });
      }

      setFormOpen(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить расход',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (expense: TripExpense) => {
    setEditingExpense(expense);
    setFormData({
      expenseType: expense.expenseType,
      amount: expense.amount.toString(),
      description: expense.description || '',
      expenseDate: format(expense.expenseDate, 'yyyy-MM-dd')
    });
    setFormOpen(true);
  };

  const handleDelete = async (expense: TripExpense) => {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) {
      return;
    }

    try {
      await supabaseService.deleteTripExpense(expense.id);
      toast({
        title: 'Расход удален',
        description: 'Расход успешно удален'
      });
      loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить расход',
        variant: 'destructive'
      });
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Расходы по рейсу
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <Ruble className="h-4 w-4" />
              <span className="font-medium">
                Итого: {totalExpenses.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <Dialog open={formOpen} onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить расход
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingExpense ? 'Редактировать расход' : 'Добавить расход'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="expenseType">Тип расхода</Label>
                    <Select
                      value={formData.expenseType}
                      onValueChange={(value) => setFormData({ ...formData, expenseType: value as ExpenseType })}
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
                    <Label htmlFor="amount">Сумма (₽)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="expenseDate">Дата расхода</Label>
                    <Input
                      id="expenseDate"
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Дополнительное описание расхода..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                      Отмена
                    </Button>
                    <Button type="submit">
                      {editingExpense ? 'Обновить' : 'Добавить'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Расходы по рейсу не добавлены</p>
          </div>
        ) : (
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
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(expense)}
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
        )}
      </CardContent>
    </Card>
  );
};
