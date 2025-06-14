
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
    const sql = this.getDB();
    console.log('PostgreSQLService: Saving cargo type:', cargoType.id ? 'update' : 'insert', cargoType);
    try {
      if (cargoType.id) {
        const [updatedCargoType] = await sql<CargoType[]>`
          UPDATE cargo_types
          SET name = ${cargoType.name},
              description = ${cargoType.description || null},
              default_weight = ${cargoType.defaultWeight || null},
              default_volume = ${cargoType.defaultVolume || null},
              hazardous = ${cargoType.hazardous || false},
              temperature_controlled = ${cargoType.temperatureControlled || false},
              fragile = ${cargoType.fragile || false},
              updated_at = NOW()
          WHERE id = ${cargoType.id}
          RETURNING id, name, description, default_weight AS "defaultWeight", default_volume AS "defaultVolume", hazardous, temperature_controlled AS "temperatureControlled", fragile, created_at AS "createdAt", updated_at AS "updatedAt"
        `;
        if (!updatedCargoType) throw new Error('Cargo type not found for update or update failed.');
        console.log('PostgreSQLService: Cargo type updated:', updatedCargoType);
        return updatedCargoType;
      } else {
        console.warn('PostgreSQLService: saveCargoType (insert) not fully implemented due to missing user_id context.');
        throw new Error('saveCargoType (insert) not implemented for PostgreSQL. Missing user context.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error saving cargo type:', error);
      throw new Error(`Failed to save cargo type: ${error instanceof Error ? error.message : String(error)}`);
    }
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
