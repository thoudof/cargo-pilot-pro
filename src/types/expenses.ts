
export interface TripExpense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// Alias for backward compatibility
export type ExpenseType = ExpenseCategory;

export enum ExpenseCategory {
  FUEL = 'fuel',
  TOLLS = 'tolls', 
  PARKING = 'parking',
  MAINTENANCE = 'maintenance',
  FOOD = 'food',
  ACCOMMODATION = 'accommodation',
  OTHER = 'other'
}

// Alias for backward compatibility
export const ExpenseType = ExpenseCategory;

export const expenseTypeLabels: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL]: 'Топливо',
  [ExpenseCategory.TOLLS]: 'Дорожные сборы',
  [ExpenseCategory.PARKING]: 'Парковка',
  [ExpenseCategory.MAINTENANCE]: 'Обслуживание',
  [ExpenseCategory.FOOD]: 'Питание',
  [ExpenseCategory.ACCOMMODATION]: 'Проживание',
  [ExpenseCategory.OTHER]: 'Прочее'
};
