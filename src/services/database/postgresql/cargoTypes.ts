
import type postgres from 'postgres';
import type { CargoType } from '@/types';

export class PostgresCargoTypesHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getCargoTypes(): Promise<CargoType[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching cargo types...');
    try {
      const cargoTypes = await sql<CargoType[]>`
        SELECT 
          id, name, description, hazardous, fragile,
          default_weight AS "defaultWeight",
          default_volume AS "defaultVolume", 
          temperature_controlled AS "temperatureControlled",
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
        FROM cargo_types
        ORDER BY name ASC
      `;
      console.log(`PostgreSQLService: Fetched ${cargoTypes.length} cargo types.`);
      return cargoTypes;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching cargo types:', error);
      throw new Error(`Failed to fetch cargo types: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveCargoType(cargoType: Partial<CargoType> & { name: string; }): Promise<CargoType> {
    this.getDB();
    console.warn('PostgreSQLService: saveCargoType not fully implemented due to missing user_id context.');
    throw new Error('saveCargoType not implemented for PostgreSQL. Missing user context.');
  }
  async deleteCargoType(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting cargo type with id:', id);
    try {
      const result = await sql`
        DELETE FROM cargo_types 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Cargo type not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Cargo type deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting cargo type:', error);
      throw new Error(`Failed to delete cargo type: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
