import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TripExpense, ExpenseCategory } from '@/types/expenses';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TripExpenseForm } from './TripExpenseForm';
import { TripExpenseHeader } from './TripExpenseHeader';
import { TripExpenseList } from './TripExpenseList';

interface TripExpensesProps {
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

export const TripExpenses: React.FC<TripExpensesProps> = ({ tripId }) => {
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | undefined>();
  const [formData, setFormData] = useState({
    expenseType: ExpenseCategory.FUEL,
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses((data || []).map(transformExpense));
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
      expenseType: ExpenseCategory.FUEL,
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
      const { data: userData } = await supabase.auth.getUser();
      
      const expenseData = {
        trip_id: tripId,
        category: formData.expenseType,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        date: formData.expenseDate,
        created_by: userData.user?.id || null
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('trip_expenses')
          .update({
            category: expenseData.category,
            amount: expenseData.amount,
            description: expenseData.description,
            date: expenseData.date
          })
          .eq('id', editingExpense.id);
          
        if (error) throw error;
        toast({
          title: 'Расход обновлен',
          description: 'Расход успешно обновлен'
        });
      } else {
        const { error } = await supabase
          .from('trip_expenses')
          .insert(expenseData);
          
        if (error) throw error;
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
      expenseType: expense.category as ExpenseCategory,
      amount: expense.amount.toString(),
      description: expense.description || '',
      expenseDate: format(expense.date, 'yyyy-MM-dd')
    });
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (expense: TripExpense) => {
    if (!confirm('Вы уверены, что хотите удалить этот расход?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('trip_expenses')
        .delete()
        .eq('id', expense.id);
        
      if (error) throw error;
      
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
      <Card>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card>
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
      </Card>
      
      <TripExpenseForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingExpense={editingExpense}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
