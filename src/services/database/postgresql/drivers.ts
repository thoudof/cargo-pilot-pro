
import type postgres from 'postgres';
import type { Driver } from '@/types';

export class PostgresDriversHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getDrivers(): Promise<Driver[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching drivers...');
    try {
      const drivers = await sql<Driver[]>`
        SELECT 
          id, name, phone, license, notes,
          experience_years AS "experienceYears", 
          passport_data AS "passportData", 
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
        FROM drivers
        ORDER BY name ASC
      `;
      console.log(`PostgreSQLService: Fetched ${drivers.length} drivers.`);
      return drivers;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching drivers:', error);
      throw new Error(`Failed to fetch drivers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveDriver(driver: Partial<Driver> & { name: string; phone: string; }): Promise<Driver> {
    this.getDB();
    console.warn('PostgreSQLService: saveDriver not fully implemented due to missing user_id context.');
    // @ts-ignore
    throw new Error('saveDriver not implemented for PostgreSQL. Missing user context.');
  }

  async deleteDriver(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting driver with id:', id);
    try {
      const result = await sql`
        DELETE FROM drivers 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Driver not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Driver deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting driver:', error);
      throw new Error(`Failed to delete driver: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
