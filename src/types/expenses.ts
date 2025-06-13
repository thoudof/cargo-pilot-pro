
export interface TripExpense {
  id: string;
  tripId: string;
  expenseType: ExpenseType;
  amount: number;
  description?: string;
  receiptUrl?: string;
  expenseDate: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export enum ExpenseType {
  FUEL = 'fuel',
  TOLLS = 'tolls', 
  PARKING = 'parking',
  MAINTENANCE = 'maintenance',
  FOOD = 'food',
  ACCOMMODATION = 'accommodation',
  OTHER = 'other'
}

export const expenseTypeLabels = {
  [ExpenseType.FUEL]: 'Топливо',
  [ExpenseType.TOLLS]: 'Дорожные сборы',
  [ExpenseType.PARKING]: 'Парковка',
  [ExpenseType.MAINTENANCE]: 'Обслуживание',
  [ExpenseType.FOOD]: 'Питание',
  [ExpenseType.ACCOMMODATION]: 'Проживание',
  [ExpenseType.OTHER]: 'Прочее'
};
