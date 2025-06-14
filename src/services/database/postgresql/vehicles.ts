
import type postgres from 'postgres';
import type { Vehicle } from '@/types';

export class PostgresVehiclesHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getVehicles(): Promise<Vehicle[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching vehicles...');
    try {
      const vehicles = await sql<Vehicle[]>`
        SELECT 
          id, brand, model, year, capacity, vin, notes,
          license_plate AS "licensePlate", 
          registration_certificate AS "registrationCertificate",
          insurance_policy AS "insurancePolicy", 
          technical_inspection_expiry AS "technicalInspectionExpiry",
          insurance_expiry AS "insuranceExpiry",
          created_at AS "createdAt", 
          updated_at AS "updatedAt"
        FROM vehicles
        ORDER BY brand ASC, model ASC
      `;
      console.log(`PostgreSQLService: Fetched ${vehicles.length} vehicles.`);
      return vehicles;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching vehicles:', error);
      throw new Error(`Failed to fetch vehicles: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveVehicle(vehicle: Partial<Vehicle> & { brand: string; model: string; licensePlate: string; }): Promise<Vehicle> {
    this.getDB();
    console.warn('PostgreSQLService: saveVehicle not fully implemented due to missing user_id context.');
    throw new Error('saveVehicle not implemented for PostgreSQL. Missing user context.');
  }
  async deleteVehicle(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting vehicle with id:', id);
    try {
      const result = await sql`
        DELETE FROM vehicles 
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Vehicle not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Vehicle deleted successfully.');
      }
    } catch (error)
    {
      console.error('PostgreSQLService: Error deleting vehicle:', error);
      throw new Error(`Failed to delete vehicle: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
