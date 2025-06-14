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

  async saveDriver(driver: Partial<Driver> & { name: string; phone: string; }, userId: string): Promise<Driver> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Saving driver:', driver.id ? 'update' : 'insert', driver);
    try {
      if (driver.id) {
        const [updatedDriver] = await sql<Driver[]>`
          UPDATE drivers
          SET name = ${driver.name},
              phone = ${driver.phone},
              license = ${driver.license || null},
              passport_data = ${driver.passportData || null},
              experience_years = ${driver.experienceYears || null},
              notes = ${driver.notes || null},
              updated_at = NOW()
          WHERE id = ${driver.id}
          RETURNING id, name, phone, license, passport_data AS "passportData", experience_years AS "experienceYears", notes, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!updatedDriver) throw new Error('Driver not found for update or update failed.');
        console.log('PostgreSQLService: Driver updated:', updatedDriver);
        return updatedDriver;
      } else {
        if (!userId) {
          throw new Error('User ID is required to create a new driver.');
        }
        const [newDriver] = await sql<Driver[]>`
          INSERT INTO drivers (name, phone, license, passport_data, experience_years, notes, user_id)
          VALUES (${driver.name}, ${driver.phone}, ${driver.license || null}, ${driver.passportData || null}, ${driver.experienceYears || null}, ${driver.notes || null}, ${userId})
          RETURNING id, name, phone, license, passport_data AS "passportData", experience_years AS "experienceYears", notes, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!newDriver) throw new Error('Driver creation failed.');
        console.log('PostgreSQLService: Driver created:', newDriver);
        return newDriver;
      }
    } catch (error) {
      console.error('PostgreSQLService: Error saving driver:', error);
      throw new Error(`Failed to save driver: ${error instanceof Error ? error.message : String(error)}`);
    }
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
