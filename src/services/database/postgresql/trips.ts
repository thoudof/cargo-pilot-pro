
import type postgres from 'postgres';
import type { Trip } from '@/types';

export class PostgresTripsHandler {
  constructor(private getDB: () => postgres.Sql) {}

  async getTrips(): Promise<Trip[]> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Fetching trips...');
    try {
      const trips = await sql<Trip[]>`
        SELECT
          id, status, documents, comments,
          departure_date AS "departureDate",
          arrival_date AS "arrivalDate",
          point_a AS "pointA",
          point_b AS "pointB",
          contractor_id AS "contractorId",
          driver_id AS "driverId",
          vehicle_id AS "vehicleId",
          route_id AS "routeId",
          cargo_type_id AS "cargoTypeId",
          cargo_description AS "cargoDescription",
          cargo_weight AS "cargoWeight",
          cargo_volume AS "cargoVolume",
          cargo_value AS "cargoValue",
          driver_name AS "driverName",
          driver_phone AS "driverPhone",
          driver_license AS "driverLicense",
          vehicle_brand AS "vehicleBrand",
          vehicle_model AS "vehicleModel",
          vehicle_license_plate AS "vehicleLicensePlate",
          vehicle_capacity AS "vehicleCapacity",
          created_at AS "createdAt",
          updated_at AS "updatedAt",
          user_id AS "userId"
        FROM trips
        ORDER BY "departureDate" DESC
      `;
      console.log(`PostgreSQLService: Fetched ${trips.length} trips.`);
      return trips;
    } catch (error) {
      console.error('PostgreSQLService: Error fetching trips:', error);
      throw new Error(`Failed to fetch trips: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async saveTrip(trip: Partial<Trip>): Promise<Trip> {
    this.getDB();
    console.warn('PostgreSQLService: saveTrip not fully implemented due to missing user_id context.');
    throw new Error('saveTrip not implemented for PostgreSQL. Missing user context.');
  }
  async deleteTrip(id: string): Promise<void> {
    const sql = this.getDB();
    console.log('PostgreSQLService: Deleting trip with id:', id);
    try {
      const result = await sql`
        DELETE FROM trips
        WHERE id = ${id}
      `;
      if (result.count === 0) {
        console.warn('PostgreSQLService: Trip not found for deletion or delete failed.');
      } else {
        console.log('PostgreSQLService: Trip deleted successfully.');
      }
    } catch (error) {
      console.error('PostgreSQLService: Error deleting trip:', error);
      throw new Error(`Failed to delete trip: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
