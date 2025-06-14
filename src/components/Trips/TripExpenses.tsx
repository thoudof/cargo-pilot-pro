import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { TripExpense, ExpenseType } from '@/types/expenses';
import { appDbService } from '@/services/database/AppDatabaseService';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TripExpenseForm } from './TripExpenseForm';
import { TripExpenseHeader } from './TripExpenseHeader';
import { TripExpenseList } from './TripExpenseList';

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

  const loadExpenses = useCallback(async () => {
    try {
      const data = await appDbService.getTripExpenses(tripId);
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
  }, [tripId, toast]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const resetForm = useCallback(() => {
    setFormData({
      expenseType: ExpenseType.FUEL,
      amount: '',
      description: '',
      expenseDate: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(undefined);
  }, []);

  const handleAddExpense = useCallback(() => {
    resetForm();
    setFormOpen(true);
  }, [resetForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        await appDbService.updateTripExpense(editingExpense.id, expenseData);
        toast({
          title: 'Расход обновлен',
          description: 'Расход успешно обновлен'
        });
      } else {
        await appDbService.createTripExpense(expenseData);
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
  }, [formData, editingExpense, tripId, toast, resetForm, loadExpenses]);

  const handleEdit = useCallback((expense: TripExpense) => {
    setEditingExpense(expense);
    setFormData({
      expenseType: expense.expenseType,
      amount: expense.amount.toString(),
      description: expense.description || '',
      expenseDate: format(expense.expenseDate, 'yyyy-MM-dd')
    });
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (expense: TripExpense) => {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) {
      return;
    }

    try {
      await appDbService.deleteTripExpense(expense.id);
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
  }, [toast, loadExpenses]);

  const handleCancel = useCallback(() => {
    setFormOpen(false);
    resetForm();
  }, [resetForm]);

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, expenseItem) => sum + expenseItem.amount, 0), 
    [expenses]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <Dialog open={formOpen} onOpenChange={(open) => {
        setFormOpen(open);
        if (!open) resetForm();
      }}>
        <TripExpenseHeader 
          totalExpenses={totalExpenses}
          onAddExpense={handleAddExpense}
        />
        <CardContent>
          <TripExpenseList 
            expenses={expenses}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
        
        <TripExpenseForm
          open={formOpen}
          onOpenChange={setFormOpen}
          editingExpense={editingExpense}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Dialog>
    </Card>
  );
};
