
import type postgres from 'postgres';
import type { TripExpense } from '@/types/expenses';

export class PostgresExpensesHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getTripExpenses(tripId: string): Promise<TripExpense[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching expenses for tripId:', tripId);
    try {
      const expenses = await sql<TripExpense[]>`
        SELECT 
          id,
          trip_id AS "tripId",
          user_id AS "userId",
          expense_type AS "expenseType",
          amount,
          description,
          expense_date AS "expenseDate",
          receipt_url AS "receiptUrl",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM trip_expenses
        WHERE trip_id = ${tripId}
        ORDER BY expense_date DESC
      `;
      console.log(`PostgreSQLService: Fetched ${expenses.length} expenses for trip ${tripId}.`);
      return expenses;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching trip expenses:', error);
      throw new Error(`Failed to fetch trip expenses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async createTripExpense(expense: Omit<TripExpense, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & { tripId: string }): Promise<TripExpense> {
    this.getDB();
    console.warn('PostgreSQLService: createTripExpense not fully implemented due to missing user_id context.');
    // @ts-ignore
    throw new Error('createTripExpense not implemented for PostgreSQL. Missing user context.');
  }
  async updateTripExpense(id: string, expense: Partial<Omit<TripExpense, 'id'|'createdAt'|'updatedAt'|'userId'|'tripId'>>): Promise<TripExpense> {
    this.getDB();
    console.warn('PostgreSQLService: updateTripExpense not fully implemented due to missing user_id context.');
    // @ts-ignore
    throw new Error('updateTripExpense not implemented for PostgreSQL. Missing user context.');
  }
  async deleteTripExpense(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting trip expense with id:', id);
    try {
      const result = await sql`
        DELETE FROM trip_expenses 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Trip expense not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Trip expense deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting trip expense:', error);
      throw new Error(`Failed to delete trip expense: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
